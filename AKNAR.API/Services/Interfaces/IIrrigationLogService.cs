using AKNAR.API.DTOS;
using AKNAR.API.Models;

namespace AKNAR.API.Services.Interfaces
{
    public interface IIrrigationLogService
    {
        Task<List<IrrigationLogDto>> GetByOrchardAsync(int orchardId);
        Task<IrrigationLog> CreateAsync(IrrigationLog log);

        Task<IrrigationLog?> DeleteAsync(int id);

        Task<object> GetSummaryAsync(int orchardId);

    }
}
