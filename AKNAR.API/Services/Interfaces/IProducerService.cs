using AKNAR.API.DTOS;

namespace AKNAR.API.Services.Interfaces
{
    public interface IProducerService
    {
        Task<List<ProducerDto>> GetAllAsync();
        Task<ProducerDto?> GetByIdAsync(int id);
        Task<ProducerDto?> GetByUserIdAsync(int userId);
        Task<bool> UpdateAsync(int id, UpdateProducerDto dto);
    }
}
