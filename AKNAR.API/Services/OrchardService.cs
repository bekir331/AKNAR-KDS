using AKNAR.API.DTOS;
using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;



namespace AKNAR.API.Services

{
    public class OrchardService : IOrchardService
    {
        private readonly AknarKdsContext _context;

        public OrchardService(AknarKdsContext context)
        {
            _context = context;
        }

        // Sadece aktif bahçeler (dashboard & listeler için)
        public async Task<List<Orchard>> GetAllAsync()
        {
            return await _context.Orchards
                .Where(o => o.IsActive)
                .Include(o => o.Producer)
                .ToListAsync();
        }

        // Admin paneli: pasifler dahil tüm bahçeler
        public async Task<List<Orchard>> GetAllIncludingInactiveAsync()
        {
            return await _context.Orchards
                .Include(o => o.Producer)
                .OrderByDescending(o => o.IsActive)
                .ThenByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<Orchard?> GetByIdAsync(int id)
        {
            return await _context.Orchards
                .Include(o => o.Producer)
                .Include(o => o.Devices)
                .Include(o => o.Alerts.Where(a => !a.IsRead))
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        // Producer'ın bahçeleri (opsiyonel olarak pasifler dahil)
        public async Task<List<Orchard>> GetByProducerAsync(int producerId, bool includeInactive = false)
        {
            var query = _context.Orchards.Where(o => o.ProducerId == producerId);
            
            if (!includeInactive)
            {
                query = query.Where(o => o.IsActive);
            }

            return await query
                .Include(o => o.Devices)
                .ToListAsync();
        }

        public async Task<Orchard> CreateAsync(Orchard orchard)
        {
            orchard.CreatedAt = DateTime.Now;
            _context.Orchards.Add(orchard);
            await _context.SaveChangesAsync();
            return orchard;
        }

        public async Task<bool> UpdateAsync(int id, UpdateOrchardDto dto)
        {
            var orchard = await _context.Orchards.FindAsync(id);
            if (orchard == null) return false;

            // Sadece izin verilen alanlar güncelleniyor
            // ProducerId ve CreatedAt değiştirilemez
            orchard.Name        = dto.Name;
            orchard.AreaHectare = dto.AreaHectare;
            orchard.Location    = dto.Location;
            orchard.Latitude    = dto.Latitude;
            orchard.Longitude   = dto.Longitude;
            orchard.Boundaries  = dto.Boundaries;
            orchard.ImageUrl    = dto.ImageUrl;

            await _context.SaveChangesAsync();
            return true;
        }


        // Soft-delete: bahçeyi pasifleştir, veriler korunur
        public async Task<bool> DeactivateAsync(int id)
        {
            var orchard = await _context.Orchards.FindAsync(id);
            if (orchard == null) return false;

            orchard.IsActive = false;
            orchard.DeactivatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        // Pasif bahçeyi tekrar aktifleştir
        public async Task<bool> ActivateAsync(int id)
        {
            var orchard = await _context.Orchards.FindAsync(id);
            if (orchard == null) return false;

            orchard.IsActive = true;
            orchard.DeactivatedAt = null;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ProducerExistsAsync(int producerId)
        {
            return await _context.Producers.AnyAsync(p => p.Id == producerId);
        }


        // Dashboard için tek çağrıda bahçe özeti
        public async Task<object?> GetSummaryAsync(int orchardId)
        {
            var orchardExists = await _context.Orchards.AnyAsync(o => o.Id == orchardId);
            if (!orchardExists) return null;

            var lastReading = await _context.SensorReadings
                .Include(r => r.Device)
                .Where(r => r.Device.OrchardId == orchardId)
                .OrderByDescending(r => r.ReadAt)
                .Select(r => new
                {
                    r.SoilMoisture,
                    r.AirTemperature,
                    r.AirHumidity,
                    r.LightLevel,
                    r.ReadAt
                })
                .FirstOrDefaultAsync();

            var unreadAlertCount = await _context.Alerts
                .CountAsync(a => a.OrchardId == orchardId && !a.IsRead);

            var lastPrediction = await _context.Mlpredictions
                .Where(p => p.OrchardId == orchardId)
                .OrderByDescending(p => p.PredictedAt)
                .Select(p => new
                {
                    p.Id,
                    p.PredictedLabel,
                    p.Confidence,
                    p.RiskLevel,
                    p.PredictedAt,
                    ImageUrl = _context.LeafImages.Where(li => li.PredictionId == p.Id).Select(li => li.FilePath).FirstOrDefault()
                })
                .FirstOrDefaultAsync();

            var lastIrrigation = await _context.IrrigationLogs
                .Where(l => l.OrchardId == orchardId)
                .OrderByDescending(l => l.LoggedAt)
                .Select(l => new
                {
                    l.Id,
                    l.Note,
                    l.LoggedAt
                })
                .FirstOrDefaultAsync();

            return new
            {
                orchardId,
                lastReading,
                unreadAlertCount,
                lastPrediction,
                lastIrrigation
            };
        }

        public async Task<object?> GetIrrigationAdviceAsync(int orchardId)
        {
            var orchardExists = await _context.Orchards.AnyAsync(o => o.Id == orchardId);
            if (!orchardExists) return null;

            var lastReading = await _context.SensorReadings
                .Include(r => r.Device)
                .Where(r => r.Device.OrchardId == orchardId)
                .OrderByDescending(r => r.ReadAt)
                .FirstOrDefaultAsync();

            if (lastReading == null) 
            {
                return new { score = 0, message = "Sensör verisi bulunamadı. Öneri hesaplanamıyor." };
            }

            double score = 0;
            string message = "";

            if (lastReading.SoilMoisture < 30) 
            {
                score = 85;
                message = "Toprak nemi çok düşük, acil sulama gerekiyor.";
            }
            else if (lastReading.SoilMoisture < 50)
            {
                score = 50;
                message = "Toprak nemi azalmış, sulama planlanabilir.";
            }
            else 
            {
                score = 10;
                message = "Toprak nemi yeterli seviyede.";
            }

            // Sıcaklık etkisi
            if (lastReading.AirTemperature > 35)
            {
                score += 15;
                message += " Yüksek hava sıcaklığı nedeniyle su kaybı artabilir.";
            }

            if (score > 100) score = 100;

            return new { 
                score = score, 
                message = message, 
                lastReading = new {
                    lastReading.SoilMoisture,
                    lastReading.AirTemperature,
                    lastReading.ReadAt
                }
            };
        }
    }
}
