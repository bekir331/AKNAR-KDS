using AKNAR.API.Services.Interfaces;
using AKNAR.API.Models;
using Microsoft.EntityFrameworkCore;



namespace AKNAR.API.Services
{
    public class DeviceService : IDeviceService
    {
        private readonly AknarKdsContext _context;
        public DeviceService(AknarKdsContext context)
        {
            _context = context;


        }

        public async Task<List<Device>>GetAllAsync()
        {
            return await _context.Devices
               .Include(d => d.Orchard)
               .ToListAsync();
        }
        public async Task<Device?>GetByIdAsync(int id)
        {
            return await _context.Devices
                .Include (d => d.Orchard)
                .Include(d => d.SensorReadings
                .OrderByDescending(s => s.ReadAt)
                .Take(5))
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<List<Device>>GetByOrchardAsync(int orchardId)
        {
            return await _context.Devices
                .Where(d => d.OrchardId == orchardId)
                .ToListAsync();
        }

        public async Task<bool> OrchardExistsAsync(int orchardId)
        {
            return await _context.Orchards.AnyAsync(o => o.Id == orchardId);
        }

        public async Task<Device> CreateAsync(Device device)
        {
            device.IsActive = true;
            device.LastSeen = null;
            _context.Devices.Add(device);
            await _context.SaveChangesAsync();
            return device;
        }

        public async Task<bool> ToggleAsync(int id)
        {
            var device = await _context.Devices.FindAsync(id);
            if (device == null) return false;

            device.IsActive = !device.IsActive;
      

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var device = await _context.Devices.FindAsync(id);
            if (device == null) return false;

            _context.Devices.Remove(device);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
