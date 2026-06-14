using AKNAR.API.Authorization;
using AKNAR.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AKNAR.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AlertsController : ControllerBase
    {
        private readonly IAlertService _alertService;
        private readonly IOwnershipService _ownership;

        public AlertsController(IAlertService alertService, IOwnershipService ownership)
        {
            _alertService = alertService;
            _ownership = ownership;
        }

        [HttpGet("orchard/{orchardId}")]
        public async Task<IActionResult> GetByOrchard(int orchardId)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(orchardId);
            if (deny != null) return deny;

            var alerts = await _alertService.GetByOrchardAsync(orchardId);
            return Ok(alerts);
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var orchardId = await _ownership.GetOrchardIdOfAlertAsync(id);
            if (orchardId == null) return NotFound(new { error = "Uyarı bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(orchardId.Value);
            if (deny != null) return deny;

            var success = await _alertService.MarkAsReadAsync(id);
            if (!success) return NotFound(new { error = "Uyarı bulunamadı." });
            return Ok(new { message = "Uyarı okundu olarak işaretlendi." });
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
