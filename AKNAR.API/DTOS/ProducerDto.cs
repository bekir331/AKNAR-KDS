namespace AKNAR.API.DTOS
{
    public class ProducerDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;

        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }

        public DateTime CreatedAt { get; set; }
        public int OrchardCount { get; set; }
    }
}
