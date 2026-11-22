using AKNAR.API.DTOS;
using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AKNAR.API.Services
{
    public class SensorReadingService : ISensorReadingService
    {
        private readonly AknarKdsContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<SensorReadingService> _logger;

        public SensorReadingService(
            AknarKdsContext context,
            IEmailService emailService,
            ILogger<SensorReadingService> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
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

                        if (type == "LowMoisture")
                        {
                            await SendEmailAlertAsync(device.OrchardId, message);
                        }
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

        private async Task SendEmailAlertAsync(int orchardId, string alertMessage)
        {
            try
            {
                var orchard = await _context.Orchards
                    .Include(o => o.Producer)
                    .ThenInclude(p => p.User)
                    .FirstOrDefaultAsync(o => o.Id == orchardId);

                if (orchard?.Producer?.User?.Email != null)
                {
                    string subject = $"ACİL SULAMA UYARISI - {orchard.Name}";
                    string body = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);'>
                            <div style='background-color: #ef4444; padding: 20px; text-align: center;'>
                                <h2 style='color: white; margin: 0; font-size: 24px; letter-spacing: 1px;'>ACİL SULAMA UYARISI</h2>
                            </div>
                            <div style='padding: 30px; background-color: #ffffff;'>
                                <p style='font-size: 16px; color: #374151; margin-top: 0;'>Sayın <strong>{orchard.Producer.User.FullName}</strong>,</p>
                                <p style='font-size: 16px; color: #4b5563; line-height: 1.5;'>
                                    <strong>{orchard.Name}</strong> bahçenizdeki sensörlerden kritik bir düşüş tespit edildi. Bitkilerinizin sağlığını korumak için acilen müdahale etmeniz gerekebilir.
                                </p>
                                <div style='background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0; border-radius: 0 4px 4px 0;'>
                                    <p style='margin: 0; color: #b91c1c; font-size: 16px; font-weight: bold;'>{alertMessage}</p>
                                </div>
                                <p style='font-size: 16px; color: #4b5563; line-height: 1.5;'>
                                    Lütfen en kısa sürede bahçenizi kontrol edin ve sulama işlemini başlatın. Uygulama üzerinden detaylı değerleri görebilirsiniz.
                                </p>
                            </div>
                            <div style='background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;'>
                                <p style='margin: 0; font-size: 12px; color: #9ca3af;'>Bu e-posta AKNAR KDS (Karar Destek Sistemi) tarafından otomatik olarak oluşturulmuştur.</p>
                            </div>
                        </div>";

                    await _emailService.SendEmailAsync(orchard.Producer.User.Email, subject, body);
                    _logger.LogInformation($"Acil sulama uyarı e-postası gönderildi: {orchard.Producer.User.Email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Uyarı e-postası gönderilirken hata oluştu.");
            }
        }
    }
}

