using AKNAR.API.DTOS;
using AKNAR.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AKNAR.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProducersController : ControllerBase
    {
        private readonly IProducerService _producerService;

        public ProducersController(IProducerService producerService)
        {
            _producerService = producerService;
        }

        [Authorize(Roles = "Admin,Consultant")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var producers = await _producerService.GetAllAsync();
            return Ok(producers);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { error = "Token geçersiz." });

            var userId = int.Parse(userIdClaim.Value);
            var producer = await _producerService.GetByUserIdAsync(userId);
            if (producer == null)
                return NotFound(new { error = "Üretici profili bulunamadı." });

            return Ok(producer);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var producer = await _producerService.GetByIdAsync(id);
            if (producer == null)
                return NotFound(new { error = "Üretici bulunamadı." });

            if (!CanAccessProducer(producer.UserId))
                return Forbid();

            return Ok(producer);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProducerDto dto)
        {
            var producer = await _producerService.GetByIdAsync(id);
            if (producer == null)
                return NotFound(new { error = "Üretici bulunamadı." });

            if (!CanAccessProducer(producer.UserId))
                return Forbid();

            var success = await _producerService.UpdateAsync(id, dto);
            if (!success)
                return NotFound(new { error = "Üretici bulunamadı." });

            return Ok(new { message = "Üretici profili güncellendi." });
        }

        private bool CanAccessProducer(int producerUserId)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "Admin" || role == "Consultant")
                return true;

            var myIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (myIdClaim == null) return false;

            return int.Parse(myIdClaim.Value) == producerUserId;
        }
    }
}
