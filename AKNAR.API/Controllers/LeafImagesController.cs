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
    public class LeafImagesController : ControllerBase
    {
        private readonly AknarKdsContext _context;
        private readonly IOwnershipService _ownership;

        public LeafImagesController(AknarKdsContext context, IOwnershipService ownership)
        {
            _context = context;
            _ownership = ownership;
        }

        [HttpGet("orchard/{orchardId}")]
        public async Task<IActionResult> GetByOrchard(int orchardId)
        {
            var orchardExists = await _context.Orchards.AnyAsync(o => o.Id == orchardId);
            if (!orchardExists)
                return NotFound(new { error = "Bahçe bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(orchardId);
            if (deny != null) return deny;

            var images = await _context.LeafImages
                .Where(li => li.OrchardId == orchardId)
                .Include(li => li.Mlprediction)
                .OrderByDescending(li => li.UploadedAt)
                .Select(li => new LeafImageDto
                {
                    Id = li.Id,
                    OrchardId = li.OrchardId,
                    ImageUrl = "/" + li.FilePath,
                    UploadedAt = li.UploadedAt,
                    PredictionId = li.PredictionId,
                    PredictedLabel = li.Mlprediction != null ? li.Mlprediction.PredictedLabel : null,
                    Confidence = li.Mlprediction != null ? li.Mlprediction.Confidence : null,
                    RiskLevel = li.Mlprediction != null ? li.Mlprediction.RiskLevel : null,
                    PredictedAt = li.Mlprediction != null ? li.Mlprediction.PredictedAt : (DateTime?)null
                })
                .ToListAsync();

            return Ok(images);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var li = await _context.LeafImages
                .Include(x => x.Mlprediction)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (li == null)
                return NotFound(new { error = "Görsel bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(li.OrchardId);
            if (deny != null) return deny;

            var dto = new LeafImageDto
            {
                Id = li.Id,
                OrchardId = li.OrchardId,
                ImageUrl = "/" + li.FilePath,
                UploadedAt = li.UploadedAt,
                PredictionId = li.PredictionId,
                PredictedLabel = li.Mlprediction?.PredictedLabel,
                Confidence = li.Mlprediction?.Confidence,
                RiskLevel = li.Mlprediction?.RiskLevel,
                PredictedAt = li.Mlprediction?.PredictedAt
            };

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var li = await _context.LeafImages.FirstOrDefaultAsync(x => x.Id == id);
            if (li == null)
                return NotFound(new { error = "Görsel bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(li.OrchardId);
            if (deny != null) return deny;

            var absolutePath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                li.FilePath.Replace('/', Path.DirectorySeparatorChar));

            if (System.IO.File.Exists(absolutePath))
            {
                System.IO.File.Delete(absolutePath);
            }

            _context.LeafImages.Remove(li);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Görsel silindi." });
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
