using AKNAR.API.DTOS;
using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AKNAR.API.Services
{
    public class ProducerService : IProducerService
    {
        private readonly AknarKdsContext _context;

        public ProducerService(AknarKdsContext context)
        {
            _context = context;
        }

        public async Task<List<ProducerDto>> GetAllAsync()
        {
            return await _context.Producers
                .Include(p => p.User)
                .Select(p => new ProducerDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    FullName = p.User.FullName,
                    Email = p.User.Email,
                    Role = p.User.Role,
                    Phone = p.Phone,
                    Address = p.Address,
                    City = p.City,
                    CreatedAt = p.User.CreatedAt,
                    OrchardCount = p.Orchards.Count
                })
                .ToListAsync();
        }

        public async Task<ProducerDto?> GetByIdAsync(int id)
        {
            return await _context.Producers
                .Include(p => p.User)
                .Where(p => p.Id == id)
                .Select(p => new ProducerDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    FullName = p.User.FullName,
                    Email = p.User.Email,
                    Role = p.User.Role,
                    Phone = p.Phone,
                    Address = p.Address,
                    City = p.City,
                    CreatedAt = p.User.CreatedAt,
                    OrchardCount = p.Orchards.Count
                })
                .FirstOrDefaultAsync();
        }

        public async Task<ProducerDto?> GetByUserIdAsync(int userId)
        {
            return await _context.Producers
                .Include(p => p.User)
                .Where(p => p.UserId == userId)
                .Select(p => new ProducerDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    FullName = p.User.FullName,
                    Email = p.User.Email,
                    Role = p.User.Role,
                    Phone = p.Phone,
                    Address = p.Address,
                    City = p.City,
                    CreatedAt = p.User.CreatedAt,
                    OrchardCount = p.Orchards.Count
                })
                .FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateAsync(int id, UpdateProducerDto dto)
        {
            var producer = await _context.Producers
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (producer == null) return false;

            if (dto.Phone != null) producer.Phone = dto.Phone;
            if (dto.Address != null) producer.Address = dto.Address;
            if (dto.City != null) producer.City = dto.City;

            if (!string.IsNullOrWhiteSpace(dto.FullName))
                producer.User.FullName = dto.FullName;

            if (!string.IsNullOrWhiteSpace(dto.Password))
                producer.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
