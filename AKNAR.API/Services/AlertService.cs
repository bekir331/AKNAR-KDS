using Microsoft.EntityFrameworkCore;
using AKNAR.API.Services.Interfaces;
using AKNAR.API.Models;

namespace AKNAR.API.Services
{
    public class AlertService : IAlertService
    {
        private readonly AknarKdsContext _context;

        public AlertService(AknarKdsContext context)
        {
            _context = context;
        }

        public async Task<List<Alert>>GetByOrchardAsync(int orcharId)
        {
            return await _context.Alerts
                .Where(a => a.OrchardId == orcharId)
                .OrderBy(a => a.CreatedAt)
                .ToListAsync();
        }
        public async Task<bool>MarkAsReadAsync(int id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null) return false;
            alert.IsRead = true;
             await _context.SaveChangesAsync();
            return true;
        }


    }
}
