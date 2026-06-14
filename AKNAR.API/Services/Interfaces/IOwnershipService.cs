namespace AKNAR.API.Services.Interfaces
{
    public interface IOwnershipService
    {
        Task<int?> GetProducerIdByUserIdAsync(int userId);

        Task<bool> UserOwnsOrchardAsync(int userId, int orchardId);

        Task<int?> GetOrchardIdOfLeafImageAsync(int leafImageId);

        Task<int?> GetOrchardIdOfIrrigationLogAsync(int irrigationLogId);

        Task<int?> GetOrchardIdOfAlertAsync(int alertId);

        Task<int?> GetOrchardIdForDeviceAsync(int deviceId);
    }
}
