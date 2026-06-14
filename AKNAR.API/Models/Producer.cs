using System;
using System.Collections.Generic;

namespace AKNAR.API.Models;

public partial class Producer
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? Phone { get; set; }

    public string? Address { get; set; }

    public string? City { get; set; }

    public virtual ICollection<Orchard> Orchards { get; set; } = new List<Orchard>();

    public virtual User User { get; set; } = null!;
}
