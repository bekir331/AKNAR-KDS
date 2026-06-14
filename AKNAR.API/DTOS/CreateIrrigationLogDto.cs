namespace AKNAR.API.DTOS
{
    public class CreateIrrigationLogDto
    {
        // Kullanıcının göndereceği alanlar
        public int OrchardId { get; set; }
        public string? Note { get; set; }

        // UserId ve LoggedAt server tarafında set edilir, dışarıdan alınmaz
    }
}
