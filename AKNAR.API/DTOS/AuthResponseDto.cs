namespace AKNAR.API.DTOS
{
    public class AuthResponseDto
    {

        public string Token { get; set; }

        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }

        public string Message { get; set; }
    }
}
