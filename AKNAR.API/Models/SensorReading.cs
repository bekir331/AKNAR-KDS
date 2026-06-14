using System;
using System.Collections.Generic;

namespace AKNAR.API.Models;

public partial class SensorReading
{
    public int Id { get; set; }

    public int DeviceId { get; set; }

    public double? SoilMoisture { get; set; }

    public double? AirTemperature { get; set; }

    public double? AirHumidity { get; set; }

    public double? LightLevel { get; set; }

    public DateTime ReadAt { get; set; }

    public virtual Device Device { get; set; } = null!;
}
