using System;

namespace AKNAR.API.Models
{
    public class SensorKdsReport
    {
        public int Id { get; set; }
        public int OrchardId { get; set; }
        public double Score { get; set; }
        public string Advice { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public virtual Orchard? Orchard { get; set; }
    }
}
