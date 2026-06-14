using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AKNAR.API.Services
{
    public class OwnershipService : IOwnershipService
    {
        private readonly AknarKdsContext _context;

        public OwnershipService(AknarKdsContext context)
        {
            _context = context;
        }

        public async Task<int?> GetProducerIdByUserIdAsync(int userId)
        {
            var producer = await _context.Producers
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            return producer?.Id;
        }

        public async Task<bool> UserOwnsOrchardAsync(int userId, int orchardId)
        {
            return await _context.Orchards
                .AsNoTracking()
                .AnyAsync(o => o.Id == orchardId && o.Producer.UserId == userId);
        }

        public async Task<int?> GetOrchardIdOfLeafImageAsync(int leafImageId)
        {
            return await _context.LeafImages
                .AsNoTracking()
                .Where(x => x.Id == leafImageId)
                .Select(x => (int?)x.OrchardId)
                .FirstOrDefaultAsync();
        }

        public async Task<int?> GetOrchardIdOfIrrigationLogAsync(int irrigationLogId)
        {
            return await _context.IrrigationLogs
                .AsNoTracking()
                .Where(x => x.Id == irrigationLogId)
                .Select(x => (int?)x.OrchardId)
                .FirstOrDefaultAsync();
        }

        public async Task<int?> GetOrchardIdOfAlertAsync(int alertId)
        {
            return await _context.Alerts
                .AsNoTracking()
                .Where(x => x.Id == alertId)
                .Select(x => (int?)x.OrchardId)
                .FirstOrDefaultAsync();
        }

        public async Task<int?> GetOrchardIdForDeviceAsync(int deviceId)
        {
            return await _context.Devices
                .AsNoTracking()
                .Where(d => d.Id == deviceId)
                .Select(d => (int?)d.OrchardId)
                .FirstOrDefaultAsync();
        }
    }
}
