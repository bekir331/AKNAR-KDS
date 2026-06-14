using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace AKNAR.API.Models;

public partial class AknarKdsContext : DbContext
{
    public AknarKdsContext()
    {
    }

    public AknarKdsContext(DbContextOptions<AknarKdsContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Alert> Alerts { get; set; }

    public virtual DbSet<Device> Devices { get; set; }

    public virtual DbSet<IrrigationLog> IrrigationLogs { get; set; }

    public virtual DbSet<Mlprediction> Mlpredictions { get; set; }

    public virtual DbSet<Orchard> Orchards { get; set; }

    public virtual DbSet<Producer> Producers { get; set; }

    public virtual DbSet<SensorReading> SensorReadings { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<DiseaseRecommendation> DiseaseRecommendations { get; set; }

    public virtual DbSet<LeafImage> LeafImages { get; set; }
    
    public virtual DbSet<SensorKdsReport> SensorKdsReports { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)

        => optionsBuilder.UseSqlServer("Server=BEKIR;Database=AKNAR_KDS;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Alert>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Alerts__3214EC07E12BA7DE");

            entity.Property(e => e.AlertType).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Message).HasMaxLength(500);

            entity.HasOne(d => d.Orchard).WithMany(p => p.Alerts)
                .HasForeignKey(d => d.OrchardId)
                .HasConstraintName("FK__Alerts__OrchardI__4CA06362");
        });

        modelBuilder.Entity<Device>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Devices__3214EC077F5875D2");

            entity.HasIndex(e => e.DeviceCode, "UQ__Devices__AFFB3E9587F6AD65").IsUnique();

            entity.Property(e => e.DeviceCode).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Model).HasMaxLength(100);

            entity.HasOne(d => d.Orchard).WithMany(p => p.Devices)
                .HasForeignKey(d => d.OrchardId)
                .HasConstraintName("FK__Devices__Orchard__44FF419A");
        });

        modelBuilder.Entity<IrrigationLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Irrigati__3214EC079A728EB9");

            entity.Property(e => e.LoggedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Note).HasMaxLength(500);

            entity.HasOne(d => d.Orchard).WithMany(p => p.IrrigationLogs)
                .HasForeignKey(d => d.OrchardId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Irrigatio__Orcha__5165187F");

            entity.HasOne(d => d.User).WithMany(p => p.IrrigationLogs)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Irrigatio__UserI__52593CB8");
        });

        modelBuilder.Entity<Mlprediction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__MLPredic__3214EC0730048D65");

            entity.ToTable("MLPredictions");

            entity.Property(e => e.PredictedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.RiskLevel).HasMaxLength(20);
            entity.Property(e => e.PredictedLabel).HasMaxLength(100);

            entity.HasOne(d => d.Orchard).WithMany(p => p.Mlpredictions)
                .HasForeignKey(d => d.OrchardId)
                .HasConstraintName("FK__MLPredict__Orcha__5629CD9C");
        });

        modelBuilder.Entity<LeafImage>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.FilePath)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Orchard)
                .WithMany()
                .HasForeignKey(d => d.OrchardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Mlprediction)
                .WithMany()
                .HasForeignKey(d => d.PredictionId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Orchard>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Orchards__3214EC07A8C2FE36");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Location).HasMaxLength(300);
            entity.Property(e => e.Name).HasMaxLength(150);
            entity.Property(e => e.Latitude).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.Longitude).HasColumnType("decimal(18, 10)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Producer).WithMany(p => p.Orchards)
                .HasForeignKey(d => d.ProducerId)
                .HasConstraintName("FK__Orchards__Produc__403A8C7D");
        });

        modelBuilder.Entity<Producer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Producer__3214EC07B0538EAD");

            entity.HasIndex(e => e.UserId, "UQ__Producer__1788CC4D3D4CF471").IsUnique();

            entity.Property(e => e.Address).HasMaxLength(300);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);

            entity.HasOne(d => d.User).WithOne(p => p.Producer)
                .HasForeignKey<Producer>(d => d.UserId)
                .HasConstraintName("FK__Producers__UserI__3D5E1FD2");
        });

        modelBuilder.Entity<SensorReading>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SensorRe__3214EC075CD4B9A1");

            entity.Property(e => e.ReadAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Device).WithMany(p => p.SensorReadings)
                .HasForeignKey(d => d.DeviceId)
                .HasConstraintName("FK__SensorRea__Devic__48CFD27E");
        });

        modelBuilder.Entity<SensorKdsReport>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Advice).IsRequired();

            entity.HasOne(d => d.Orchard)
                .WithMany()
                .HasForeignKey(d => d.OrchardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC0724E33D54");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D105345F6C2466").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.PasswordHash).HasMaxLength(256);
            entity.Property(e => e.Role).HasMaxLength(20);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
