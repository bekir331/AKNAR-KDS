using AKNAR.API.DTOS;
using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AKNAR.API.Services
{
    public class SensorReadingService : ISensorReadingService
    {
        private readonly AknarKdsContext _context;

        public SensorReadingService(AknarKdsContext context)
        {
            _context = context;
        }

        public async Task<List<SensorReading>> GetByDeviceAsync(int deviceId)
        {
            return await _context.SensorReadings
                .Where(r => r.DeviceId == deviceId)
                .OrderByDescending(r => r.ReadAt)
                .Take(50)
                .ToListAsync();
        }

        // Bahçeye ait tüm cihazların son 'limit' okumasını döner
        // Frontend grafiklerinde sensör geçmişini göstermek için kullanılır
        public async Task<List<SensorReading>> GetByOrchardAsync(int orchardId, int limit = 100)
        {
            return await _context.SensorReadings
                .Include(r => r.Device)
                .Where(r => r.Device.OrchardId == orchardId)
                .OrderByDescending(r => r.ReadAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<SensorReading?> GetLatestByOrchardAsync(int orchardId)
        {
            return await _context.SensorReadings
                .Include(r => r.Device)
                .Where(r => r.Device.OrchardId == orchardId)
                .OrderByDescending(r => r.ReadAt)
                .FirstOrDefaultAsync();
        }

        public async Task<SensorReading> AddReadingAsync(SensorReading reading)
        {
            reading.ReadAt = reading.ReadAt == default ? DateTime.Now : reading.ReadAt;

            _context.SensorReadings.Add(reading);

            var device = await _context.Devices.FindAsync(reading.DeviceId);
            if (device != null)
                device.LastSeen = DateTime.Now;

            await _context.SaveChangesAsync();

            if (device != null)
                await CheckAndCreateAlertAsync(reading, device);

            return reading;
        }

        public async Task<SensorReading?> IngestByDeviceCodeAsync(string deviceCode, SensorIngestPayloadDto payload)
        {
            var device = await _context.Devices
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.DeviceCode == deviceCode && d.IsActive);

            if (device == null)
                return null;

            var reading = new SensorReading
            {
                DeviceId = device.Id,
                SoilMoisture = payload.SoilMoisture,
                AirTemperature = payload.AirTemperature,
                AirHumidity = payload.AirHumidity,
                LightLevel = payload.LightLevel,
                ReadAt = DateTime.Now
            };

            return await AddReadingAsync(reading);
        }

        // Sensör verisine göre eşik kontrolü yapar ve gerekirse alert oluşturur.
        // Duplicate alert önleme: aynı türde okunmamış alert varsa, en son değerle günceller.
        // Eğer durum normale dönerse, ilgili okunmamış alert'ü otomatik olarak okundu (çözüldü) işaretler.
        private async Task CheckAndCreateAlertAsync(SensorReading reading, Device device)
        {
            var rules = new List<(bool condition, string type, string message)>
            {
                (
                    reading.SoilMoisture.HasValue && reading.SoilMoisture < 30,
                    "LowMoisture",
                    $"Toprak nemi kritik seviyede: %{reading.SoilMoisture:F1}"
                ),
                (
                    reading.AirTemperature.HasValue && reading.AirTemperature > 38,
                    "HighTemperature",
                    $"Hava sıcaklığı kritik: {reading.AirTemperature:F1}°C"
                ),
                (
                    reading.AirHumidity.HasValue && reading.AirHumidity < 40,
                    "LowHumidity",
                    $"Hava nemi çok düşük: %{reading.AirHumidity:F1}"
                ),
                (
                    reading.LightLevel.HasValue && reading.LightLevel < 500,
                    "LowLight",
                    $"Işık seviyesi yetersiz: {reading.LightLevel:F0} lux"
                )
            };

            bool anyChanged = false;

            foreach (var (condition, type, message) in rules)
            {
                // Aynı bahçede aynı türde zaten okunmamış bir alert var mı?
                var existingAlert = await _context.Alerts.FirstOrDefaultAsync(a =>
                    a.OrchardId == device.OrchardId &&
                    a.AlertType == type &&
                    !a.IsRead);

                if (condition)
                {
                    if (existingAlert == null)
                    {
                        _context.Alerts.Add(new Alert
                        {
                            OrchardId = device.OrchardId,
                            AlertType = type,
                            Message   = message,
                            CreatedAt = DateTime.Now
                        });
                        anyChanged = true;
                    }
                    else
                    {
                        // En son ölçüme göre uyarı mesajını ve zamanını güncelle (üyelerin görmesi için)
                        existingAlert.Message = message;
                        existingAlert.CreatedAt = DateTime.Now;
                        anyChanged = true;
                    }
                }
                else
                {
                    // Durum normale döndüyse, okunmamış alert'ü otomatik olarak temizle/kapat
                    if (existingAlert != null)
                    {
                        existingAlert.IsRead = true;
                        anyChanged = true;
                    }
                }
            }

            if (anyChanged)
                await _context.SaveChangesAsync();
        }
    }
}

