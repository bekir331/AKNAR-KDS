namespace AKNAR.API.DTOS
{
    public class CreateOrchardDto
    {
        public int ProducerId { get; set; }
        public string Name { get; set; }
         
            public double? AreaHectare { get; set; }
        
        public string? Location { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? Boundaries { get; set; }
        public string? ImageUrl { get; set; }
    }
}
