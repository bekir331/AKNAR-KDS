
using AKNAR.API.DTOS;
namespace AKNAR.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginDto dto);
            Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);

        Task<AuthResponseDto?> CreateUserAsync(CreateUserDto dto);

        Task<object?> GetUserByIdAsync(int userId);

        Task<List<AuthResponseDto>> GetAllUsersAsync();
        Task<bool> DeleteUserAsync(int userId);


    }
}
