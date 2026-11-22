namespace AKNAR.API.DTOS
{
    public class UpdateOrchardDto
    {
        // Kullanıcının güncelleyebileceği alanlar
        public string Name { get; set; } = null!;
        public double? AreaHectare { get; set; }
        public string? Location { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Boundaries { get; set; }
        public string? ImageUrl { get; set; }

        // ProducerId ve CreatedAt değiştirilemez — dışarıdan alınmaz
    }
}
