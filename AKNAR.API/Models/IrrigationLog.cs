using System;
using System.Collections.Generic;

namespace AKNAR.API.Models;

public partial class IrrigationLog
{
    public int Id { get; set; }

    public int OrchardId { get; set; }

    public int UserId { get; set; }

    public string? Note { get; set; }

    public DateTime LoggedAt { get; set; }

    public virtual Orchard Orchard { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
