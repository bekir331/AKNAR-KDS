using AKNAR.API.Authorization;
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

    public class MLPredictionsController : ControllerBase
    {
        private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

        private readonly AknarKdsContext _context;
        private readonly IImageClassificationService _imageService;
        private readonly IGeminiService _geminiService;
        private readonly IWebHostEnvironment _env;
        private readonly IOwnershipService _ownership;

        public MLPredictionsController(
            AknarKdsContext context,
            IImageClassificationService imageService,
            IGeminiService geminiService,
            IWebHostEnvironment env,
            IOwnershipService ownership)
        {
            _context = context;
            _imageService = imageService;
            _geminiService = geminiService;
            _env = env;
            _ownership = ownership;
        }

        [HttpGet("orchard/{orchardId}")]
        public async Task<IActionResult> GetByOrchard(int orchardId)
        {
            var deny = await DenyIfNotOrchardOwnerAsync(orchardId);
            if (deny != null) return deny;

            var predictions = await _context.Mlpredictions
                .Where(p => p.OrchardId == orchardId)
                 .OrderByDescending(p => p.PredictedAt)
                 .ToListAsync();
            return Ok(predictions);
        }

        [HttpPost("train")]
        [Authorize(Roles = "Admin")]
        public IActionResult TrainModel()
        {
            try
            {
                _imageService.TrainModel();
                return Ok(new { message = "Model eğitildi." });

            }

            catch (Exception ex)
            {
                return BadRequest(new { message = $"Model eğitilirken hata oluştu: {ex.Message}" });
            }
        }

        [HttpPost("predict/orchard/{orchardId}")]
        public async Task<IActionResult> PredictDisease(
      int orchardId,
      IFormFile image)
        {
            if (!_imageService.IsModelReady())
                return BadRequest(new { error = "Model henüz eğitilmedi. Önce /train çağırın." });

            if (image == null || image.Length == 0)
                return BadRequest(new { error = "Görsel yüklenmedi." });

            var orchardExists = await _context.Orchards.AnyAsync(o => o.Id == orchardId);
            if (!orchardExists)
                return NotFound(new { error = "Bahçe bulunamadı." });

            var deny = await DenyIfNotOrchardOwnerAsync(orchardId);
            if (deny != null) return deny;

            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!AllowedImageExtensions.Contains(extension))
                return BadRequest(new { error = $"Desteklenmeyen dosya türü. İzinli: {string.Join(", ", AllowedImageExtensions)}" });

            using var ms = new MemoryStream();
            await image.CopyToAsync(ms);
            var imageBytes = ms.ToArray();

            // Gemini Vision ile yaprak doğrulama
            var (isLeaf, validationMessage) = await _geminiService.ValidateLeafImageAsync(imageBytes);
            if (!isLeaf)
            {
                return BadRequest(new
                {
                    error = "Bu görsel bir bitki yaprağı değil. Lütfen net bir yaprak fotoğrafı yükleyin.",
                    detail = validationMessage
                });
            }

            var result = _imageService.Predict(imageBytes);
            double maxScore = result.Score?.Max() ?? 0;
            double confidence = Math.Round(maxScore * 100, 2);

      
            if (confidence < 85)
            {
                return Ok(new
                {
                    predictedLabel = "Tanınamadı",
                    confidence,
                    message = "Görsel yeterli güvenle sınıflandırılamadı. Lütfen net bir yaprak görseli yükleyin."
                });
            }

          
            string riskLevel = result.PredictedLabel == "Healthy Leaf" ? "Low" : "High";

           
            var staticRec = await _context.DiseaseRecommendations
                .FirstOrDefaultAsync(r => r.DiseaseName == result.PredictedLabel);

          
            var orchard = await _context.Orchards
                .FirstOrDefaultAsync(o => o.Id == orchardId);

           
            string? sensorInfo = null;
            var latestReading = await _context.SensorReadings
                .Include(r => r.Device)
                .Where(r => r.Device.OrchardId == orchardId)
                .OrderByDescending(r => r.ReadAt)
                .FirstOrDefaultAsync();

            if (latestReading != null)
            {
                sensorInfo = $"Toprak Nemi: %{latestReading.SoilMoisture}, " +
                             $"Hava Sıcaklığı: {latestReading.AirTemperature}°C, " +
                             $"Hava Nemi: %{latestReading.AirHumidity}, " +
                             $"Işık: {latestReading.LightLevel} lux";
            }

           
            string aiRecommendation = "";
            if (staticRec != null)
            {
                var staticText = $"Açıklama: {staticRec.Description} | Tedavi: {staticRec.Treatment} | Önlem: {staticRec.Prevention}";
                aiRecommendation = await _geminiService.GetRecommendationAsync(
                    result.PredictedLabel,
                    confidence,
                    staticText,
                    sensorInfo,
                    orchard?.Location);
            }

            // 9. Veritabanına kaydet
            var prediction = new Mlprediction
            {
                OrchardId = orchardId,
                PredictedLabel = result.PredictedLabel,
                Confidence = confidence,
                RiskLevel = riskLevel,
                PredictedAt = DateTime.Now
            };

            _context.Mlpredictions.Add(prediction);
            await _context.SaveChangesAsync();

            var fileName = $"{Guid.NewGuid()}{extension}";
            var relativePath = Path.Combine("uploads", "leaves", fileName).Replace('\\', '/');
            var absolutePath = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "leaves", fileName);

            await System.IO.File.WriteAllBytesAsync(absolutePath, imageBytes);

            var leafImage = new LeafImage
            {
                OrchardId = orchardId,
                FilePath = relativePath,
                PredictionId = prediction.Id,
                UploadedAt = DateTime.Now
            };

            _context.LeafImages.Add(leafImage);
            await _context.SaveChangesAsync();

            var imageUrl = $"/{relativePath}";

            return Ok(new
            {
                prediction = new
                {
                    predictedLabel = result.PredictedLabel,
                    confidence,
                    riskLevel,
                    predictionId = prediction.Id
                },
                staticRecommendation = staticRec != null ? new
                {
                    staticRec.Description,
                    staticRec.Treatment,
                    staticRec.Prevention,
                    staticRec.SeasonWarning
                } : null,
                aiRecommendation,
                imageUrl,
                leafImageId = leafImage.Id
            });
        }

        private async Task<IActionResult?> DenyIfNotOrchardOwnerAsync(int orchardId)
        {
            if (User.IsStaff()) return null;

            if (!User.TryGetUserId(out var userId))
                return Unauthorized(new { error = "Kullanıcı kimliği okunamadı." });

            var ok = await _ownership.UserOwnsOrchardAsync(userId, orchardId);
            return ok ? null : Forbid();
        }

        [HttpGet("status")]

        public IActionResult GetModelStatus()
        {
            return Ok(new
            {
                modelReady = _imageService.IsModelReady(),
                message = _imageService.IsModelReady()
                ? "Model Tahmin Yapmaya Hazır."
                : "Model henüz eğitilmedi. Önce /train çağırın."

            });
        }





        [HttpPost("chatbot")]
        public async Task<IActionResult> Chatbot([FromBody] DTOS.ChatbotRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { error = "Mesaj boş olamaz." });

            var response = await _geminiService.GetChatbotResponseAsync(dto.Message, dto.Context);
            return Ok(new { response });
        }
    }
}