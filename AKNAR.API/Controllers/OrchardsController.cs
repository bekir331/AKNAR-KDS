using AKNAR.API.Authorization;
using AKNAR.API.DTOS;
using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AKNAR.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrchardsController : ControllerBase
    {
        private readonly IOrchardService _orchardService;
        private readonly IOwnershipService _ownership;

        public OrchardsController(IOrchardService orchardService, IOwnershipService ownership)
        {
            _orchardService = orchardService;
            _ownership = ownership;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
        {
            if (User.IsStaff())
            {
                // Admin/Consultant: isteğe bağlı olarak pasifleri de getirebilir
                var all = includeInactive 
                    ? await _orchardService.GetAllIncludingInactiveAsync()
                    : await _orchardService.GetAllAsync();
                return Ok(all);
            }

            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { error = "Kullanıcı kimliği okunamadı." });

            var producerId = await _ownership.GetProducerIdByUserIdAsync(userId);
            if (producerId == null)
                return Ok(new List<Orchard>());

            var mine = await _orchardService.GetByProducerAsync(producerId.Value, includeInactive);
            return Ok(mine);
        }

        // Admin: pasifler dahil tüm bahçeleri gör (aktifleştirmek için)
        [HttpGet("all-with-inactive")]
        [Authorize(Roles = "Admin,Consultant")]
        public async Task<IActionResult> GetAllWithInactive()
        {
            var all = await _orchardService.GetAllIncludingInactiveAsync();
            return Ok(all);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var orchard = await _orchardService.GetByIdAsync(id);
            if (orchard == null) return NotFound(new { error = "Bahçe bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(id);
            if (deny != null) return deny;

            return Ok(orchard);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrchardDto dto)
        {
            if (!User.IsStaff())
            {
                if (!User.TryGetUserId(out var userId))
                    return Unauthorized(new { error = "Kullanıcı kimliği okunamadı." });

                var myProducerId = await _ownership.GetProducerIdByUserIdAsync(userId);
                if (myProducerId == null)
                    return BadRequest(new { error = "Bu kullanıcıya bağlı üretici kaydı bulunamadı." });

                dto.ProducerId = myProducerId.Value;
            }
            else
            {
                // Staff ise: ProducerId gönderilmemişse kendi producer kaydını kullan
                if (dto.ProducerId <= 0)
                {
                    if (!User.TryGetUserId(out var staffUserId))
                        return Unauthorized(new { error = "Kullanıcı kimliği okunamadı." });

                    var staffProducerId = await _ownership.GetProducerIdByUserIdAsync(staffUserId);
                    if (staffProducerId == null)
                        return BadRequest(new { error = "ProducerId gönderilmedi ve bu kullanıcıya bağlı üretici kaydı bulunamadı." });

                    dto.ProducerId = staffProducerId.Value;
                }
                else
                {
                    // Gönderilen ProducerId gerçekten var mı?
                    var producerExists = await _orchardService.ProducerExistsAsync(dto.ProducerId);
                    if (!producerExists)
                        return BadRequest(new { error = $"ProducerId={dto.ProducerId} olan üretici bulunamadı." });
                }
            }

            var orchard = new Orchard
            {
                ProducerId = dto.ProducerId,
                Name = dto.Name,
                AreaHectare = dto.AreaHectare,
                Location = dto.Location,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Boundaries = dto.Boundaries,
                ImageUrl = dto.ImageUrl
            };

            var result = await _orchardService.CreateAsync(orchard);
            return Ok(new { message = "Bahçe oluşturuldu.", id = result.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateOrchardDto dto)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(id);
            if (deny != null) return deny;

           
         var success = await _orchardService.UpdateAsync(id, dto);
            if (!success) return NotFound(new { error = "Bahçe bulunamadı." });
            return Ok(new { message = "Bahçe güncellendi." });
        }

        // Soft-delete: bahçeyi pasifleştir (veriler korunur)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(id);
            if (deny != null) return deny;

            var success = await _orchardService.DeactivateAsync(id);
            if (!success) return NotFound(new { error = "Bahçe bulunamadı." });
            return Ok(new { message = "Bahçe pasifleştirildi. Veriler korunuyor." });
        }

        // Pasif bahçeyi tekrar aktifleştir
        [HttpPatch("{id}/activate")]
        public async Task<IActionResult> Activate(int id)
        {
            // Sahiplik veya staff kontrolü
            if (!User.IsStaff())
            {
                if (!User.TryGetUserId(out var userId))
                    return Unauthorized(new { error = "Kullanıcı kimliği okunamadı." });
                var ok = await _ownership.UserOwnsOrchardAsync(userId, id);
                if (!ok) return Forbid();
            }

            var success = await _orchardService.ActivateAsync(id);
            if (!success) return NotFound(new { error = "Bahçe bulunamadı." });
            return Ok(new { message = "Bahçe tekrar aktifleştirildi." });
        }

        [HttpGet("producer/{producerId}")]
        public async Task<IActionResult> GetByProducer(int producerId)
        {
            if (!User.IsStaff())
            {
                if (!User.TryGetUserId(out var userId))
                    return Unauthorized(new { error = "Kullanıcı kimliği okunamadı." });

                var myProducerId = await _ownership.GetProducerIdByUserIdAsync(userId);
                if (myProducerId != producerId)
                    return Forbid();
            }

            var orchards = await _orchardService.GetByProducerAsync(producerId);
            return Ok(orchards);
        }

        // Dashboard kartı için tek endpoint — 4 veriyi bir arada döner
        [HttpGet("{id}/summary")]
        public async Task<IActionResult> GetSummary(int id)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(id);
            if (deny != null) return deny;

            var summary = await _orchardService.GetSummaryAsync(id);
            if (summary == null)
                return NotFound(new { error = "Bahçe bulunamadı." });

            return Ok(summary);
        }

        [HttpGet("{id}/irrigation-advice")]
        public async Task<IActionResult> GetIrrigationAdvice(int id)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(id);
            if (deny != null) return deny;

            var advice = await _orchardService.GetIrrigationAdviceAsync(id);
            if (advice == null)
                return NotFound(new { error = "Bahçe bulunamadı." });

            return Ok(advice);
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
