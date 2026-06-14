
using AKNAR.API.Models;
namespace AKNAR.API.Services.Interfaces
 
{
    public interface IAlertService
    {
        Task<List<Alert>> GetByOrchardAsync(int  orchardId);
        Task<bool> MarkAsReadAsync(int id);


    }
}
