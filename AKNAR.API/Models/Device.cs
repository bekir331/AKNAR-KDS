using System;
using System.Collections.Generic;

namespace AKNAR.API.Models;

public partial class Device
{
    public int Id { get; set; }

    public int OrchardId { get; set; }

    public string DeviceCode { get; set; } = null!;

    public string? Model { get; set; }

    public bool IsActive { get; set; }

    public DateTime? LastSeen { get; set; }

    public virtual Orchard Orchard { get; set; } = null!;

    public virtual ICollection<SensorReading> SensorReadings { get; set; } = new List<SensorReading>();
}
