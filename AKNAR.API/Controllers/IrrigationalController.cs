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
    public class IrrigationLogsController : ControllerBase
    {
        private readonly IIrrigationLogService _irrigationService;
        private readonly IOwnershipService _ownership;

        public IrrigationLogsController(
            IIrrigationLogService irrigationService,
            IOwnershipService ownership)
        {
            _irrigationService = irrigationService;
            _ownership = ownership;
        }

        [HttpGet("orchard/{orchardId}")]
        public async Task<IActionResult> GetByOrchard(int orchardId)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(orchardId);
            if (deny != null) return deny;

            var logs = await _irrigationService.GetByOrchardAsync(orchardId);
            return Ok(logs);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateIrrigationLogDto dto)
        {
            // Sahiplik kontrolü (Admin/Consultant bypass, Producer sadece kendi bahçesine)
            var deny = await DenyIfNotOrchardOwnerAsync(dto.OrchardId);
            if (deny != null) return deny;

            // UserId her zaman token'dan alınır — kaydı kimin oluşturduğu
            if (!User.TryGetUserId(out var currentUserId))
                return Unauthorized(new { error = "Kullanıcı kimliği okunamadı." });

            var log = new IrrigationLog
            {
                OrchardId = dto.OrchardId,
                UserId    = currentUserId,
                Note      = dto.Note
                // LoggedAt → IrrigationLogService.CreateAsync içinde DateTime.Now set edilir
            };

            var result = await _irrigationService.CreateAsync(log);
            return Ok(new { message = "Sulama kaydı oluşturuldu.", id = result.Id });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var orchardId = await _ownership.GetOrchardIdOfIrrigationLogAsync(id);
            if (orchardId == null) return NotFound(new { error = "Kayıt bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(orchardId.Value);
            if (deny != null) return deny;

            var result = await _irrigationService.DeleteAsync(id);
            if (result == null) return NotFound(new { error = "Kayıt bulunamadı." });
            return Ok(new { message = "Kayıt silindi." });
        }

        [HttpGet("orchard/{orchardId}/summary")]
        public async Task<IActionResult> GetSummary(int orchardId)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(orchardId);
            if (deny != null) return deny;

            var summary = await _irrigationService.GetSummaryAsync(orchardId);
            return Ok(summary);
        }

        private async Task<IActionResult?> DenyIfNotOrchardOwnerAsync(int orchardId)
        {
            if (User.IsStaff()) return null;

            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { error = "Kullanıcı kimliği okunamadı." });

            var ok = await _ownership.UserOwnsOrchardAsync(userId, orchardId);
            return ok ? null : Forbid();
        }
    }
}
