using AKNAR.API.Authorization;
using AKNAR.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AKNAR.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SensorKdsController : ControllerBase
    {
        private readonly ISensorMlService _mlService;
        private readonly IOwnershipService _ownership;

        public SensorKdsController(ISensorMlService mlService, IOwnershipService ownership)
        {
            _mlService = mlService;
            _ownership = ownership;
        }

        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok(new
            {
                modelReady = _mlService.IsModelReady(),
                message = _mlService.IsModelReady() 
                    ? "Sensör KDS Modeli Hazır." 
                    : "Model henüz eğitilmedi. Lütfen /train endpointini çalıştırın."
            });
        }

        [HttpPost("train")]
        [Authorize(Roles = "Admin")]
        public IActionResult Train()
        {
            try
            {
                var metrics = _mlService.TrainModel();
                return Ok(new { message = "Sensör KDS modeli başarıyla eğitildi.", metrics = metrics });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Eğitim sırasında hata oluştu.", detail = ex.Message });
            }
        }

        [HttpGet("report/{orchardId}")]
        public async Task<IActionResult> GetReport(int orchardId)
        {
            // Güvenlik kontrolü
            if (!User.TryGetUserId(out var userId))
                return Unauthorized();

            var ownsOrchard = await _ownership.UserOwnsOrchardAsync(userId, orchardId);
            if (!ownsOrchard && !User.IsStaff())
                return Forbid();

            var report = await _mlService.GetKdsReportAsync(orchardId);
            if (report == null)
                return NotFound(new { error = "Bahçeye ait sensör verisi bulunamadı." });

            return Ok(report);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] int? orchardId)
        {
            if (!User.TryGetUserId(out var userId))
                return Unauthorized();

            if (User.IsStaff())
            {
                var history = await _mlService.GetHistoryAsync(orchardId);
                return Ok(history);
            }
            else
            {
                var producerId = await _ownership.GetProducerIdByUserIdAsync(userId);
                if (producerId == null) return Ok(new List<object>());

                if (orchardId.HasValue)
                {
                    var owns = await _ownership.UserOwnsOrchardAsync(userId, orchardId.Value);
                    if (!owns) return Forbid();
                }

                var history = await _mlService.GetHistoryAsync(orchardId, producerId.Value);
                return Ok(history);
            }
        }

        [HttpPost("generate-mock/{orchardId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GenerateMock(int orchardId, [FromServices] AKNAR.API.Models.AknarKdsContext db)
        {
            var device = db.Devices.FirstOrDefault(d => d.OrchardId == orchardId);
            if (device == null) return BadRequest(new { error = "Bu bahçeye ait cihaz bulunamadı." });

            var random = new Random();
            var now = DateTime.Now;

            for (int i = 1; i <= 20; i++)
            {
                var time = now.AddHours(-i * 5).AddMinutes(random.Next(-45, 45)); // Farklı saatler
                
                float moisture = random.Next(25, 95);
                float temp = random.Next(10, 40);
                float humidity = random.Next(30, 85);
                float light = random.Next(1000, 15000);

                var reading = new AKNAR.API.Models.SensorReading
                {
                    DeviceId = device.Id,
                    SoilMoisture = moisture,
                    AirTemperature = temp,
                    AirHumidity = humidity,
                    LightLevel = light,
                    ReadAt = time
                };
                db.SensorReadings.Add(reading);

                double score = (temp > 30 && moisture < 40) ? random.Next(70, 99) : 
                               ((temp > 22 && moisture < 65) ? random.Next(40, 69) : random.Next(5, 39));
                
                string advice = score > 70 ? "Hava sıcaklığı ve düşük nem bitki stresini artırıyor. Acil sulama tavsiye edilir." : 
                               (score > 40 ? "Toprak nemi kritik seviyeye yaklaşıyor. Sulama programını gözden geçirin." : 
                               "Ortam koşulları bitki gelişimi için ideal. Sulama yapılmasına gerek yoktur.");

                var report = new AKNAR.API.Models.SensorKdsReport
                {
                    OrchardId = orchardId,
                    Score = score,
                    Advice = $"[Sıcaklık: {temp}°C, Toprak Nemi: %{moisture}] {advice}",
                    CreatedAt = time
                };
                db.SensorKdsReports.Add(report);
            }

            await db.SaveChangesAsync();
            return Ok(new { message = "Geçmişe dönük 20 adet rastgele sensör verisi ve analiz raporu başarıyla basıldı!" });
        }

        [HttpDelete("clear-mock/{orchardId}")]
        [AllowAnonymous]
        public async Task<IActionResult> ClearMock(int orchardId, [FromServices] AKNAR.API.Models.AknarKdsContext db)
        {
            // O bahçeye ait KDS raporlarını sil
            var reports = db.SensorKdsReports.Where(r => r.OrchardId == orchardId);
            db.SensorKdsReports.RemoveRange(reports);

            // O bahçenin cihazlarını bul ve cihazlara bağlı okumaları sil
            var devices = db.Devices.Where(d => d.OrchardId == orchardId).Select(d => d.Id).ToList();
            var readings = db.SensorReadings.Where(r => devices.Contains(r.DeviceId));
            db.SensorReadings.RemoveRange(readings);

            await db.SaveChangesAsync();
            return Ok(new { message = $"Bahçe ID {orchardId} için tüm geçmiş sensör verileri ve analiz raporları başarıyla silindi!" });
        }
    }
}
