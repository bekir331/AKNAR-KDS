using System;
using System.Collections.Generic;

namespace AKNAR.API.Models;

public partial class Orchard
{
    public int Id { get; set; }

    public int ProducerId { get; set; }

    public string Name { get; set; } = null!;

    public double? AreaHectare { get; set; }

    public string? Location { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Boundaries { get; set; }
    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>Soft-delete: false ise bahçe gizlenir, veriler korunur.</summary>
    public bool IsActive { get; set; } = true;

    public DateTime? DeactivatedAt { get; set; }

    public virtual ICollection<Alert> Alerts { get; set; } = new List<Alert>();

    public virtual ICollection<Device> Devices { get; set; } = new List<Device>();

    public virtual ICollection<IrrigationLog> IrrigationLogs { get; set; } = new List<IrrigationLog>();

    public virtual ICollection<Mlprediction> Mlpredictions { get; set; } = new List<Mlprediction>();

    public virtual Producer Producer { get; set; } = null!;
}
