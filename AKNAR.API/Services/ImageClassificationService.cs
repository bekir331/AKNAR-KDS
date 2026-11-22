using Microsoft.ML;
using Microsoft.ML.Vision;
using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;

namespace AKNAR.API.Services
{
    public class ImageClassificationService : IImageClassificationService
    {
        private readonly MLContext _mlContext;
        private readonly string _modelPath;
        private readonly string _trainingDataPath;
        private ITransformer? _trainedModel;
        private PredictionEngine<ImageData, ImagePrediction>? _predictionEngine;

        public ImageClassificationService(IWebHostEnvironment env)
        {
            _mlContext = new MLContext(seed: 1);

            var contentRoot = env.ContentRootPath;

            _trainingDataPath = Path.Combine(contentRoot, "MLAssets", "TrainingData");
            _modelPath = Path.Combine(contentRoot, "MLAssets", "Models", "model.zip");

            if (File.Exists(_modelPath))
            {
                _trainedModel = _mlContext.Model.Load(_modelPath, out _);
                _predictionEngine = _mlContext.Model
                    .CreatePredictionEngine<ImageData, ImagePrediction>(_trainedModel);
            }
        }

        public bool IsModelReady() => _predictionEngine != null;

        public Dictionary<string, double> TrainModel()
        {
            var imageDataList = new List<ImageData>();

            var classDirectories = Directory.GetDirectories(_trainingDataPath);

            foreach (var classDir in classDirectories)
            {
                var label = Path.GetFileName(classDir);

                var imageFiles = Directory.GetFiles(classDir, "*.jpg")
                    .Concat(Directory.GetFiles(classDir, "*.png"))
                    .Concat(Directory.GetFiles(classDir, "*.jpeg"));

                foreach (var imagePath in imageFiles)
                {
                    imageDataList.Add(new ImageData
                    {
                        ImagePath = imagePath,
                        Label = label
                    });
                }
            }

            if (imageDataList.Count < 5)
                throw new InvalidOperationException(
                    $"Eğitim için yeterli görsel yok. Bulunan: {imageDataList.Count}");

            var shuffled = imageDataList.OrderBy(_ => Guid.NewGuid()).ToList();

            var dataView = _mlContext.Data.LoadFromEnumerable(shuffled);

            var splitData = _mlContext.Data.TrainTestSplit(dataView, testFraction: 0.2);

            var pipeline = _mlContext.Transforms.Conversion
                .MapValueToKey("LabelKey", "Label")
                .Append(_mlContext.Transforms.LoadRawImageBytes(
                    "Image", null, "ImagePath"))
                .Append(_mlContext.MulticlassClassification.Trainers
                    .ImageClassification(new ImageClassificationTrainer.Options
                    {
                        LabelColumnName = "LabelKey",
                        FeatureColumnName = "Image",
                        Arch = ImageClassificationTrainer.Architecture.ResnetV2101,
                        Epoch = 100,
                        BatchSize = 10,
                        LearningRate = 0.01f
                    }))
                .Append(_mlContext.Transforms.Conversion
                    .MapKeyToValue("PredictedLabel", "PredictedLabel"));

            _trainedModel = pipeline.Fit(splitData.TrainSet);

            var predictions = _trainedModel.Transform(splitData.TestSet);
            var metrics = _mlContext.MulticlassClassification.Evaluate(predictions, labelColumnName: "LabelKey", predictedLabelColumnName: "PredictedLabel");

            var modelDir = Path.GetDirectoryName(_modelPath);
            if (!Directory.Exists(modelDir))
                Directory.CreateDirectory(modelDir!);

            _mlContext.Model.Save(_trainedModel, splitData.TrainSet.Schema, _modelPath);

            _predictionEngine = _mlContext.Model
                .CreatePredictionEngine<ImageData, ImagePrediction>(_trainedModel);

            return new Dictionary<string, double>
            {
                { "MicroAccuracy", metrics.MicroAccuracy },
                { "MacroAccuracy", metrics.MacroAccuracy },
                { "LogLoss", metrics.LogLoss }
            };
        }

        public ImagePrediction Predict(byte[] imageBytes)
        {
            if (_predictionEngine == null)
                throw new InvalidOperationException("Model henüz eğitilmedi!");

            var tempPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.jpg");
            File.WriteAllBytes(tempPath, imageBytes);

            try
            {
                return _predictionEngine.Predict(new ImageData
                {
                    ImagePath = tempPath
                });
            }
            finally
            {
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
        }
    }
}