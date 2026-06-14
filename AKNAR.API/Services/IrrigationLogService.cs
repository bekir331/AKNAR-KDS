using AKNAR.API.DTOS;
using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;


namespace AKNAR.API.Services
{
    public class IrrigationLogService : IIrrigationLogService

    {
        private readonly AknarKdsContext _context;
        public IrrigationLogService(AknarKdsContext context)
        {
            _context = context;
        }

        public async Task<List<IrrigationLogDto>> GetByOrchardAsync(int orchardId)
        {
            return await _context.IrrigationLogs
                .Where(l => l.OrchardId == orchardId)
                .OrderByDescending(l => l.LoggedAt)
                .Select(l => new IrrigationLogDto
                {
                    Id = l.Id,
                    OrchardId = l.OrchardId,
                    UserId = l.UserId,
                    UserFullName = l.User != null ? l.User.FullName : null,
                    Note = l.Note,
                    LoggedAt = l.LoggedAt
                })
                .ToListAsync();
        }

        public async Task<IrrigationLog> CreateAsync(IrrigationLog log)
        {
            log.LoggedAt = DateTime.Now;

            _context.IrrigationLogs.Add(log);
            await _context.SaveChangesAsync();
            return log;
        }

        public async Task<IrrigationLog?> DeleteAsync(int id)
        {
            var log = await _context.IrrigationLogs.FindAsync(id);
            if (log == null) return null;

            _context.IrrigationLogs.Remove(log);
            await _context.SaveChangesAsync();
            return log;
        }


        public async Task<object> GetSummaryAsync(int orchardId)
        {
            var thirtyDaysAgo = DateTime.Now.AddDays(-30);
          

            var count = await _context.IrrigationLogs
                .Where(l => l.OrchardId == orchardId
                         && l.LoggedAt >= thirtyDaysAgo)
                .CountAsync();
            

            var lastLog = await _context.IrrigationLogs
                .Where(l => l.OrchardId == orchardId)
                .OrderByDescending(l => l.LoggedAt)
                .FirstOrDefaultAsync();
     

            return new
            {
                orchardId = orchardId,
                last30DaysCount = count,
                lastIrrigatedAt = lastLog?.LoggedAt
              
            };
        }

    }
}
