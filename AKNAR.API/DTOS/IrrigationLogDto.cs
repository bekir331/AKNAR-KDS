namespace AKNAR.API.DTOS
{
    public class IrrigationLogDto
    {
        public int Id { get; set; }
        public int OrchardId { get; set; }
        public int UserId { get; set; }
        public string? UserFullName { get; set; }
        public string? Note { get; set; }
        public DateTime LoggedAt { get; set; }
    }
}
