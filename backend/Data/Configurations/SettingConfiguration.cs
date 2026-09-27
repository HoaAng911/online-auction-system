using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

/// <summary>Cấu hình bảng Settings (Module 3 — Hằng).</summary>
public class SettingConfiguration : IEntityTypeConfiguration<Setting>
{
  public void Configure(EntityTypeBuilder<Setting> e)
  {
    e.ToTable("Settings");

    e.HasKey(s => s.Id).HasName("PK_Settings");
    e.Property(s => s.Id).ValueGeneratedNever();

    e.Property(s => s.Key).IsRequired().HasMaxLength(100);
    e.Property(s => s.Value).IsRequired();
    e.Property(s => s.Description).HasMaxLength(255);
    e.Property(s => s.UpdatedAt).IsRequired().HasDefaultValueSql("GETUTCDATE()");

    e.HasIndex(s => s.Key).IsUnique().HasDatabaseName("UQ_Settings_Key");
  }
}
