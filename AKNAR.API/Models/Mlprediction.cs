using System;
using System.Collections.Generic;

namespace AKNAR.API.Models;

public partial class Mlprediction
{
    public int Id { get; set; }

    public int OrchardId { get; set; }

    public string? PredictedLabel { get; set; }

    public double? Confidence { get; set; }

    public double? IrrigationScore { get; set; }

    public string? RiskLevel { get; set; }

    public DateTime PredictedAt { get; set; }

    public virtual Orchard Orchard { get; set; } = null!;
}
