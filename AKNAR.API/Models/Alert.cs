using System;
using System.Collections.Generic;

namespace AKNAR.API.Models;

public partial class Alert
{
    public int Id { get; set; }

    public int OrchardId { get; set; }

    public string AlertType { get; set; } = null!;

    public string Message { get; set; } = null!;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Orchard Orchard { get; set; } = null!;
}
