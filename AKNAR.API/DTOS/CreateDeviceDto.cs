namespace AKNAR.API.DTOS
{
    public class CreateDeviceDto
    {
        public int OrchardId { get; set; }
        public string DeviceCode { get; set; } = null!;
        public string? Model { get; set; }
    }
}
