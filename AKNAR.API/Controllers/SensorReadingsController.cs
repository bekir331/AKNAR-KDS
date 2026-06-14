using AKNAR.API.Authorization;
using AKNAR.API.DTOS;
using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AKNAR.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SensorReadingsController : ControllerBase
    {
        private readonly ISensorReadingService _sensorService;
        private readonly IOwnershipService _ownership;
        private readonly IConfiguration _configuration;
        private readonly IGeminiService _geminiService;

        public SensorReadingsController(
            ISensorReadingService sensorService,
            IOwnershipService ownership,
            IConfiguration configuration,
            IGeminiService geminiService)
        {
            _sensorService = sensorService;
            _ownership = ownership;
            _configuration = configuration;
            _geminiService = geminiService;
        }

        [HttpPost("ingest/{deviceCode}")]
        [AllowAnonymous]
        public async Task<IActionResult> Ingest(
            string deviceCode,
            [FromHeader(Name = "X-Ingest-ApiKey")] string? apiKey,
            [FromBody] SensorIngestPayloadDto? payload)
        {
            var expected = _configuration["IoT:IngestApiKey"];
            if (string.IsNullOrWhiteSpace(expected))
                return StatusCode(500, new { error = "IoT:IngestApiKey yapılandırılmadı." });

            if (string.IsNullOrWhiteSpace(apiKey) || apiKey != expected)
                return Unauthorized(new { error = "Geçersiz veya eksik X-Ingest-ApiKey." });

            var body = payload ?? new SensorIngestPayloadDto();
            var result = await _sensorService.IngestByDeviceCodeAsync(deviceCode, body);
            if (result == null)
                return NotFound(new { error = "Cihaz bulunamadı veya pasif.", deviceCode });

            return Ok(new { message = "Sensör verisi kaydedildi.", id = result.Id });
        }

        [HttpPost]
        public async Task<IActionResult> PostReading([FromBody] SensorReading reading)
        {
            var orchardId = await _ownership.GetOrchardIdForDeviceAsync(reading.DeviceId);
            if (orchardId == null)
                return NotFound(new { error = "Cihaz bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(orchardId.Value);
            if (deny != null)
                return deny;

            var result = await _sensorService.AddReadingAsync(reading);
            return Ok(new { message = "Veri kaydedildi.", id = result.Id });
        }

        [HttpGet("device/{deviceId}")]
        public async Task<IActionResult> GetByDevice(int deviceId)
        {
            var orchardId = await _ownership.GetOrchardIdForDeviceAsync(deviceId);
            if (orchardId == null)
                return NotFound(new { error = "Cihaz bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(orchardId.Value);
            if (deny != null)
                return deny;

            var readings = await _sensorService.GetByDeviceAsync(deviceId);
            return Ok(readings);
        }

        // Bahçenin tüm cihazlarından birleşik okuma geçmişi — grafik için
        [HttpGet("orchard/{orchardId}")]
        public async Task<IActionResult> GetByOrchard(int orchardId, [FromQuery] int limit = 100)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(orchardId);
            if (deny != null)
                return deny;

            // Makul bir üst limit koy — 500'den fazla grafik çizmek anlamsız
            if (limit < 1 || limit > 500)
                limit = 100;

            var readings = await _sensorService.GetByOrchardAsync(orchardId, limit);
            return Ok(readings);
        }

        [HttpGet("orchard/{orchardId}/latest")]
        public async Task<IActionResult> GetLatestByOrchard(int orchardId)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(orchardId);
            if (deny != null)
                return deny;

            var latest = await _sensorService.GetLatestByOrchardAsync(orchardId);
            if (latest == null)
                return NotFound(new { error = "Bu bahçeye ait okuma bulunamadı." });
            return Ok(latest);
        }

        [HttpGet("orchard/{orchardId}/analyze")]
        public async Task<IActionResult> AnalyzeOrchardSensors(int orchardId, [FromQuery] int limit = 100)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(orchardId);
            if (deny != null) return deny;

            var readings = await _sensorService.GetByOrchardAsync(orchardId, limit);
            if (!readings.Any()) return BadRequest(new { error = "Analiz edilecek veri bulunamadı." });

            var avgTemp = readings.Average(r => r.AirTemperature ?? 0);
            var avgHum = readings.Average(r => r.AirHumidity ?? 0);
            var avgSoil = readings.Average(r => r.SoilMoisture ?? 0);
            
            string summary = $"Son {readings.Count} ölçümün ortalamaları:\n" +
                             $"Sıcaklık: {avgTemp:F1}°C\n" +
                             $"Hava Nemi: %{avgHum:F1}\n" +
                             $"Toprak Nemi: %{avgSoil:F1}\n";

            var report = await _geminiService.GetSensorAnalysisAsync(summary, null);
            return Ok(new { report });
        }

        private async Task<IActionResult?> DenyIfNotOrchardOwnerAsync(int orchardId)
        {
            if (User.IsStaff())
                return null;

            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { error = "Kullanıcı kimliği okunamadı." });

            var ok = await _ownership.UserOwnsOrchardAsync(userId, orchardId);
            return ok ? null : Forbid();
        }
    }
}
