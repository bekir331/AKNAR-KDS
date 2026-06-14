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
                _mlService.TrainModel();
                return Ok(new { message = "Sensör KDS modeli başarıyla eğitildi." });
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
            // Admin değilse sadece kendi bahçelerini görebilir mantığı eklenebilir
            // Şimdilik basit tutalım
            var history = await _mlService.GetHistoryAsync(orchardId);
            return Ok(history);
        }
    }
}
