using AKNAR.API.DTOS;
using AKNAR.API.Services;   
using AKNAR.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AKNAR.API.Services.Interfaces;


namespace AKNAR.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;


        public AuthController(IAuthService authService)
        {
            _authService = authService;

        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {

            var result = await _authService.LoginAsync(dto);
            if (result == null)
                return BadRequest(new { error = "Geçersiz email veya şifre." });
            
            if (string.IsNullOrEmpty(result.Token))
                return BadRequest(new { error = result.Message });

            return Ok(result);
        }

        [AllowAnonymous]
        [HttpPost("register")]

        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {

            try
            {
                var result = await _authService.RegisterAsync(dto);
                if (result == null)
                    return BadRequest(new { error = "Bu email zaten kayıtlı." });
                return Ok(result);
            }
            catch (InvalidOperationException ex)

            {
                return BadRequest(new { error = ex.Message });
            }

        }

        [HttpPost("create-admin")]
        public async Task<IActionResult> CreateAdmin([FromBody] CreateUserDto dto)
        {
            try
            {
                dto.Role = "Admin";
                // ↑ Rol'ü burada zorla "Admin" yapıyoruz.
                //   DTO'da ne yazarsa yazsın, bu endpoint admin oluşturur.
                var result = await _authService.CreateUserAsync(dto);
                if (result == null)
                    return BadRequest(new { error = "Bu email zaten kayıtlı." });
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }


        [Authorize(Roles = "Admin")]
        [HttpPost("create-consultant")]
        public async Task<IActionResult> CreateConsultant([FromBody] CreateUserDto dto)
        {
            try
            {
                dto.Role = "Consultant";
                // ↑ Zorla "Consultant" yapıyoruz.
                var result = await _authService.CreateUserAsync(dto);
                if (result == null)
                    return BadRequest(new { error = "Bu email zaten kayıtlı." });
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }



        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized(new { error = "Token geçersiz." });
            var userId = int.Parse(userIdClaim.Value);
            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound(new { error = "Kullanıcı bulunamadı." });
            return Ok(user);

        }
        [Authorize(Roles = "Admin")]
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _authService.GetAllUsersAsync();
      
            return Ok(users);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var myIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var myId = int.Parse(myIdClaim!.Value);
            if (myId == id) 
                return BadRequest(new { error = "Kendinizi silemezsiniz." });
        
            var success = await _authService.DeleteUserAsync(id);
            if (!success)
                return NotFound(new { error = "Kullanıcı bulunamadı." });
            return Ok(new { message = "Kullanıcı silindi." });
        }

        [AllowAnonymous]
        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] int userId, [FromQuery] string token)
        {
            var success = await _authService.VerifyEmailAsync(userId, token);
            if (!success)
                return BadRequest(new { error = "Doğrulama linki geçersiz veya süresi dolmuş." });

            return Ok(new { message = "E-posta adresiniz başarıyla doğrulandı. Artık giriş yapabilirsiniz." });
        }


    }
}
