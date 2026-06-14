using AKNAR.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AKNAR.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DiseaseRecommendationsController : ControllerBase
    {
        private readonly AknarKdsContext _context;

        public DiseaseRecommendationsController(AknarKdsContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var diseases = await _context.DiseaseRecommendations.ToListAsync();
            return Ok(diseases);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var disease = await _context.DiseaseRecommendations.FirstOrDefaultAsync(d => d.Id == id);
            if (disease == null)
                return NotFound(new { error = "Hastalık bulunamadı." });

            return Ok(disease);
        }
    }
}
