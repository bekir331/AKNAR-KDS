using System.Globalization;

namespace AKNAR.API.Models
{
    public class DiseaseRecommendation
    {

        public int Id {  get; set; }
        public string DiseaseName { get; set; } = null;

        public string Description { get; set; } = null;

        public string Treatment { get; set; } = null;

        public string Prevention { get; set; } = null;

        public string RiskLevel { get; set; } = null;

        public string? SeasonWarning { get; set; } = null;


    }
}
