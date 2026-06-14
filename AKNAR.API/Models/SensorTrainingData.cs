using Microsoft.ML.Data;

namespace AKNAR.API.Models
{
    public class SensorTrainingData
    {
        [LoadColumn(0)]
        public float SoilMoisture { get; set; }

        [LoadColumn(1)]
        public float AirTemperature { get; set; }

        [LoadColumn(2)]
        public float AirHumidity { get; set; }

        [LoadColumn(3)]
        public float LightLevel { get; set; }

        [LoadColumn(4), ColumnName("Label")]
        public float IrrigationScore { get; set; }
    }

    public class SensorScorePrediction
    {
        [ColumnName("Score")]
        public float Score { get; set; }
    }
}
