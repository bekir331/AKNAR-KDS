using AKNAR.API.DTOS;
using AKNAR.API.Models;

namespace AKNAR.API.Services.Interfaces
{
    public interface ISensorReadingService
    {
        Task<List<SensorReading>> GetByDeviceAsync(int deviceId);

        // Bahçeye ait tüm cihazların son 'limit' kadar okumasını döner (grafik için)
        Task<List<SensorReading>> GetByOrchardAsync(int orchardId, int limit = 100);

        Task<SensorReading?> GetLatestByOrchardAsync(int orchardId);
        Task<SensorReading> AddReadingAsync(SensorReading reading);
        Task<SensorReading?> IngestByDeviceCodeAsync(string deviceCode, SensorIngestPayloadDto payload);
    }
}


