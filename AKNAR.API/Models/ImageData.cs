
using Microsoft.ML.Data;
namespace AKNAR.API.Models

{
    public class ImageData
    {
        [LoadColumn(0)]
        public string ImagePath { get; set; }

        [LoadColumn(1)]
        public string Label { get; set; }


    }

    public class ImagePrediction
    {
        public string PredictedLabel { get; set; }
        public float[] Score { get; set; }
    }
}