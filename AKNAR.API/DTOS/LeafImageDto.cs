namespace AKNAR.API.DTOS
{
    public class LeafImageDto
    {
        public int Id { get; set; }
        public int OrchardId { get; set; }
        public string ImageUrl { get; set; } = null!;
        public DateTime UploadedAt { get; set; }

        public int? PredictionId { get; set; }
        public string? PredictedLabel { get; set; }
        public double? Confidence { get; set; }
        public string? RiskLevel { get; set; }
        public DateTime? PredictedAt { get; set; }
    }
}
