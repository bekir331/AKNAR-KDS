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
    public class DevicesController : ControllerBase
    {
        private readonly IDeviceService _deviceService;
        private readonly IOwnershipService _ownership;

        public DevicesController(IDeviceService deviceService, IOwnershipService ownership)
        {
            _deviceService = deviceService;
            _ownership = ownership;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (!User.IsStaff())
                return Forbid();

            var devices = await _deviceService.GetAllAsync();
            return Ok(devices);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var device = await _deviceService.GetByIdAsync(id);
            if (device == null) return NotFound(new { error = "Cihaz bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(device.OrchardId);
            if (deny != null) return deny;

            return Ok(device);
        }

        [HttpGet("orchard/{orchardId}")]
        public async Task<IActionResult> GetByOrchard(int orchardId)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(orchardId);
            if (deny != null) return deny;

            var devices = await _deviceService.GetByOrchardAsync(orchardId);
            return Ok(devices);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDeviceDto dto)
        {
            if (!await _deviceService.OrchardExistsAsync(dto.OrchardId))
                return NotFound(new { error = "Bahçe bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(dto.OrchardId);
            if (deny != null) return deny;

            var device = new Device
            {
                OrchardId = dto.OrchardId,
                DeviceCode = dto.DeviceCode,
                Model = dto.Model
            };

            var result = await _deviceService.CreateAsync(device);
            return Ok(new { message = "Cihaz eklendi.", id = result.Id });
        }

        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var orchardId = await _ownership.GetOrchardIdForDeviceAsync(id);
            if (orchardId == null) return NotFound(new { error = "Cihaz bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(orchardId.Value);
            if (deny != null) return deny;

            var success = await _deviceService.ToggleAsync(id);
            if (!success) return NotFound(new { error = "Cihaz bulunamadı." });
            return Ok(new { message = "Cihaz durumu güncellendi." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var orchardId = await _ownership.GetOrchardIdForDeviceAsync(id);
            if (orchardId == null) return NotFound(new { error = "Cihaz bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(orchardId.Value);
            if (deny != null) return deny;

            var success = await _deviceService.DeleteAsync(id);
            if (!success) return NotFound(new { error = "Cihaz bulunamadı." });
            return Ok(new { message = "Cihaz silindi." });
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
