using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AKNAR.API.Models;

public partial class User
{
    public int Id { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    [JsonIgnore]
    public string PasswordHash { get; set; } = null!;

    public string Role { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public bool IsEmailVerified { get; set; } = false;

    public string? VerificationToken { get; set; }

    public virtual ICollection<IrrigationLog> IrrigationLogs { get; set; } = new List<IrrigationLog>();

    public virtual Producer? Producer { get; set; }
}
