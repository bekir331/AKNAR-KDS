namespace AKNAR.API.DTOS
{
    public class SensorIngestPayloadDto
    {
        public double? SoilMoisture { get; set; }
        public double? AirTemperature { get; set; }
        public double? AirHumidity { get; set; }
        public double? LightLevel { get; set; }
    }
}
