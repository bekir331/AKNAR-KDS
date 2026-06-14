using AKNAR.API.Models;

namespace AKNAR.API.Services.Interfaces
{
    public interface IDeviceService
    {

         Task<List<Device>>GetAllAsync();
         Task<Device?>GetByIdAsync(int id);

         Task<List<Device>>GetByOrchardAsync(int orchardId);

        Task<bool> OrchardExistsAsync(int orchardId);

        Task<Device> CreateAsync(Device device);
        Task<bool> ToggleAsync(int id);

        Task<bool> DeleteAsync(int id);



    }
}
