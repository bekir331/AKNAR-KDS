
using AKNAR.API.DTOS;
using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AKNAR.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly AknarKdsContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
      

        public AuthService(AknarKdsContext context, IConfiguration config, IEmailService emailService)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
        {
            
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null) return null;
          

            
            bool passwordCorrect = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!passwordCorrect) return null;
           

            if (!user.IsEmailVerified)
            {
                return new AuthResponseDto
                {
                    Message = "Lütfen önce e-posta adresinize gönderilen doğrulama linkine tıklayarak hesabınızı doğrulayın."
                };
            }

            return new AuthResponseDto
            {
                Token = GenerateToken(user),
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Message = "Giriş başarılı."
            };
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
        {

            if (dto.Password.Length < 6)
            {
                return new AuthResponseDto
                {
                    Message = "Şifre en az 6 karakter olmalıdır."
                };
            }
            
            var existing = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (existing != null) return null;
            var verificationToken = Guid.NewGuid().ToString();
            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),

                Role = "Producer",
                CreatedAt = DateTime.Now,
                IsEmailVerified = false,
                VerificationToken = verificationToken
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            var producer = new Producer
            {
                UserId = user.Id,
                Phone = dto.Phone,
                City = dto.City,
                Address = dto.Address
            };

            _context.Producers.Add(producer);
            await _context.SaveChangesAsync();

            var verificationLink = $"http://localhost:5173/verify-email?userId={user.Id}&token={verificationToken}";
            
            var subject = "AKNAR KDS - E-posta Doğrulama";
            var body = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>
                    <h2>Hoş Geldiniz, {user.FullName}! 🍊</h2>
                    <p>AKNAR KDS sistemine başarıyla kayıt oldunuz. Hesabınızı aktifleştirmek için lütfen aşağıdaki butona tıklayın:</p>
                    <a href='{verificationLink}' style='display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #10b981; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;'>Hesabımı Doğrula</a>
                    <p>Eğer butona tıklayamıyorsanız, aşağıdaki linki tarayıcınıza kopyalayıp yapıştırabilirsiniz:</p>
                    <p><a href='{verificationLink}'>{verificationLink}</a></p>
                    <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;' />
                    <p style='font-size: 12px; color: #999;'>Bu e-posta otomatik olarak gönderilmiştir. Lütfen cevaplamayınız.</p>
                </div>";

            // Asenkron olarak e-postayı gönder
            _ = _emailService.SendEmailAsync(user.Email, subject, body);

            return new AuthResponseDto
            {
                Token = "", // Kayıt sonrası doğrudan giriş yapmasını engellemek için token boş dönüyoruz.
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Message = "Kayıt başarılı. Lütfen e-posta adresinize gönderilen doğrulama linkine tıklayın."
            };
        }

        public async Task<AuthResponseDto?>CreateUserAsync(CreateUserDto dto)
        {
            var allowedRoles = new[] { "Admin", "Consultant" };
            if (!allowedRoles.Contains(dto.Role))
                throw new InvalidOperationException(
                    "Geçersiz rol. Sadece Admin veya Consultant oluşturulabilir.");
            if (dto.Password.Length < 6)
                throw new InvalidOperationException("Şifre en az 6 karakter olmalıdır.");
            var existing = await _context.Users
             .FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existing != null) return null;
            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role,
                CreatedAt = DateTime.Now,
                IsEmailVerified = true // Admin eklediği için direkt onaylı sayıyoruz.
            };


            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return new AuthResponseDto
            {
                Token = GenerateToken(user),
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Message = $"{dto.Role} kullanıcı başarıyla oluşturuldu."
            };

        }
        public async Task<List<AuthResponseDto>> GetAllUsersAsync()
        {
            var users = await _context.Users
                .Include(u => u.Producer)

                .OrderByDescending(u => u.CreatedAt)

                .ToListAsync();
            return users.Select(u => new AuthResponseDto
            {
                Token = "",
                UserId = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                Message = "",
                CreatedAt = u.CreatedAt
            }).ToList();
        }

        public async Task<bool> DeleteUserAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Producer)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return false;
            if (user.Producer != null)
            {
                _context.Producers.Remove(user.Producer);
            }
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        private string GenerateToken(User user)
       
        {
            var claims = new[]
                {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(
                                        int.Parse(_config["Jwt:ExpireDays"])),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


        public async Task<object?>GetUserByIdAsync(int userId)
        {
            var user = await _context.Users
               .Include(u => u.Producer)
               .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return null;
            return new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Role,
                user.CreatedAt,
                Producer = user.Producer != null ? new
                {
                    user.Producer.Id,
                    user.Producer.Phone,
                    user.Producer.City,
                    user.Producer.Address
                } : null
            };
        }

        public async Task<bool> VerifyEmailAsync(int userId, string token)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return false;

            // React StrictMode development ortamında useEffect'i arka arkaya 2 kez çalıştırır.
            // İlk çalıştırmada token temizlenir, ikinci çalıştırmada token null olduğu için hata döner.
            // Bu yüzden eğer kullanıcı zaten doğrulanmışsa doğrudan true dönüyoruz.
            if (user.IsEmailVerified)
                return true;

            if (user.VerificationToken != token)
                return false;

            user.IsEmailVerified = true;
            user.VerificationToken = null; // Token'ı bir kez kullandıktan sonra temizle
            await _context.SaveChangesAsync();
            return true;
        }
    }
}