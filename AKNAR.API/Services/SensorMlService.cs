using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.EntityFrameworkCore;

namespace AKNAR.API.Services
{
    public class SensorMlService : ISensorMlService
    {
        private readonly MLContext _mlContext;
        private readonly string _modelPath;
        private readonly AknarKdsContext _db;
        private readonly IGeminiService _geminiService;
        private static ITransformer? _trainedModel;
        private static PredictionEngine<SensorTrainingData, SensorScorePrediction>? _predictionEngine;
        private static readonly object _lock = new object();

        public SensorMlService(IWebHostEnvironment env, AknarKdsContext db, IGeminiService geminiService)
        {
            _mlContext = new MLContext(seed: 1);
            _db = db;
            _geminiService = geminiService;
            _modelPath = Path.Combine(env.ContentRootPath, "MLAssets", "Models", "sensor_kds_model.zip");

            LoadModel();
        }

        private void LoadModel()
        {
            if (_predictionEngine != null) return;

            lock (_lock)
            {
                if (_predictionEngine != null) return;

                if (File.Exists(_modelPath))
                {
                    _trainedModel = _mlContext.Model.Load(_modelPath, out _);
                    _predictionEngine = _mlContext.Model.CreatePredictionEngine<SensorTrainingData, SensorScorePrediction>(_trainedModel);
                }
            }
        }

        public bool IsModelReady() => _predictionEngine != null;

        public void TrainModel()
        {
            // 1. Veritabanından eğitim verisi topla
            // Not: Eğer veritabanı boşsa simüle edilmiş veri seti kullanıyoruz.
            var readings = _db.SensorReadings.Take(1000).ToList();
            var trainingData = new List<SensorTrainingData>();

            if (readings.Count < 50)
            {
                // Yeterli veri yoksa mantıksal bir eğitim seti oluştur
                trainingData = GenerateSyntheticData();
            }
            else
            {
                foreach (var r in readings)
                {
                    trainingData.Add(new SensorTrainingData
                    {
                        SoilMoisture = (float)(r.SoilMoisture ?? 0),
                        AirTemperature = (float)(r.AirTemperature ?? 0),
                        AirHumidity = (float)(r.AirHumidity ?? 0),
                        LightLevel = (float)(r.LightLevel ?? 0),
                        IrrigationScore = CalculateHeuristicScore(r) // Mevcut kurallardan öğrenmesi için
                    });
                }
            }

            var dataView = _mlContext.Data.LoadFromEnumerable(trainingData);

            // 2. ML Pipeline oluştur (Regression - Sayısal Tahmin)
            var pipeline = _mlContext.Transforms.Concatenate("Features", 
                nameof(SensorTrainingData.SoilMoisture), 
                nameof(SensorTrainingData.AirTemperature), 
                nameof(SensorTrainingData.AirHumidity), 
                nameof(SensorTrainingData.LightLevel))
                .Append(_mlContext.Regression.Trainers.FastTree());

            // 3. Modeli Eğit
            _trainedModel = pipeline.Fit(dataView);

            // 4. Kaydet
            var modelDir = Path.GetDirectoryName(_modelPath);
            if (!Directory.Exists(modelDir)) Directory.CreateDirectory(modelDir!);
            
            _mlContext.Model.Save(_trainedModel, dataView.Schema, _modelPath);

            // 5. Motoru Yenile
            lock (_lock)
            {
                _predictionEngine = _mlContext.Model.CreatePredictionEngine<SensorTrainingData, SensorScorePrediction>(_trainedModel);
            }
        }

        public float PredictScore(SensorReading reading)
        {
            if (_predictionEngine == null) LoadModel();
            if (_predictionEngine == null) return 0;

            var input = new SensorTrainingData
            {
                SoilMoisture = (float)(reading.SoilMoisture ?? 0),
                AirTemperature = (float)(reading.AirTemperature ?? 0),
                AirHumidity = (float)(reading.AirHumidity ?? 0),
                LightLevel = (float)(reading.LightLevel ?? 0)
            };

            var prediction = _predictionEngine.Predict(input);
            
            // Sonucu 0-100 arasına sıkıştır
            return Math.Max(0, Math.Min(100, prediction.Score));
        }

        public async Task<object?> GetKdsReportAsync(int orchardId)
        {
            var latest = await _db.SensorReadings
                .Include(r => r.Device)
                .Where(r => r.Device.OrchardId == orchardId)
                .OrderByDescending(r => r.ReadAt)
                .FirstOrDefaultAsync();

            if (latest == null) return null;

            var score = PredictScore(latest);
            
            // Gemini ile detaylı analiz al
            string location = latest.Device?.Orchard?.Location ?? "";
            string advice = await _geminiService.GetKdsDetailedAnalysisAsync(score, latest, location);

            // 3. Veritabanına kaydet (Kalıcı geçmiş için)
            var newReport = new SensorKdsReport
            {
                OrchardId = orchardId,
                Score = Math.Round(score, 1),
                Advice = advice,
                CreatedAt = DateTime.Now
            };

            _db.SensorKdsReports.Add(newReport);
            await _db.SaveChangesAsync();

            return new
            {
                id = newReport.Id,
                score = newReport.Score,
                advice = newReport.Advice,
                reading = latest,
                analyzedAt = newReport.CreatedAt
            };
        }

        public async Task<List<object>> GetHistoryAsync(int? orchardId)
        {
            var query = _db.SensorKdsReports.AsQueryable();

            if (orchardId.HasValue)
            {
                query = query.Where(r => r.OrchardId == orchardId.Value);
            }

            var list = await query
                .Include(r => r.Orchard)
                .OrderByDescending(r => r.CreatedAt)
                .Take(50) // Son 50 kayıt
                .Select(r => new {
                    id = r.Id,
                    orchardId = r.OrchardId,
                    orchardName = r.Orchard != null ? r.Orchard.Name : "Bilinmeyen Bahçe",
                    score = r.Score,
                    advice = r.Advice,
                    date = r.CreatedAt,
                    risk = r.Score > 70 ? "KRİTİK" : r.Score > 40 ? "ORTA RİSK" : "DÜŞÜK RİSK"
                })
                .ToListAsync();

            return list.Cast<object>().ToList();
        }

        private float CalculateHeuristicScore(SensorReading r)
        {
            // Basit bir skor hesaplama mantığı (Eğitim için temel oluşturur)
            float score = 0;
            if (r.SoilMoisture < 30) score += 50;
            if (r.AirTemperature > 35) score += 20;
            if (r.AirHumidity < 30) score += 20;
            if (r.LightLevel > 5000) score += 10;
            return score;
        }

        private List<SensorTrainingData> GenerateSyntheticData()
        {
            var data = new List<SensorTrainingData>();
            var rnd = new Random();
            for (int i = 0; i < 200; i++)
            {
                float moisture = rnd.Next(10, 80);
                float temp = rnd.Next(15, 45);
                float hum = rnd.Next(20, 90);
                float light = rnd.Next(100, 10000);

                // Mantıksal bir etiket (Label) oluştur
                float score = (100 - moisture) * 0.7f + (temp > 30 ? (temp - 30) * 2 : 0) + (hum < 40 ? (40 - hum) : 0);
                
                data.Add(new SensorTrainingData { 
                    SoilMoisture = moisture, 
                    AirTemperature = temp, 
                    AirHumidity = hum, 
                    LightLevel = light, 
                    IrrigationScore = Math.Min(score, 100) 
                });
            }
            return data;
        }
    }
}
