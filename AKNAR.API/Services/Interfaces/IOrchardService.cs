using AKNAR.API.DTOS;
using AKNAR.API.Models;

namespace AKNAR.API.Services.Interfaces
{
    public interface IOrchardService
    {
        Task<List<Orchard>> GetAllAsync();                          // Sadece aktifler
        Task<List<Orchard>> GetAllIncludingInactiveAsync();         // Admin: hepsi (pasifler dahil)
        Task<Orchard?> GetByIdAsync(int id);
        Task<List<Orchard>> GetByProducerAsync(int producerId, bool includeInactive = false);     // Sahiplik bazlı liste

        Task<Orchard> CreateAsync(Orchard orchard);
        Task<bool> UpdateAsync(int id, UpdateOrchardDto dto);

        // Soft-delete: gerçek silme yerine pasifleştir
        Task<bool> DeactivateAsync(int id);
        // Tekrar aktifleştir
        Task<bool> ActivateAsync(int id);

        Task<bool> ProducerExistsAsync(int producerId);
        Task<object?> GetSummaryAsync(int orchardId);
        Task<object?> GetIrrigationAdviceAsync(int orchardId);
    }
}
