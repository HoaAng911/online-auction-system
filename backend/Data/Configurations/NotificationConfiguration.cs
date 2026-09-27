using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

/// <summary>Cấu hình bảng Notifications (Module 3 — Hằng).</summary>
public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
  public void Configure(EntityTypeBuilder<Notification> e)
  {
    e.ToTable("Notifications");

    e.HasKey(n => n.Id).HasName("PK_Notifications");
    e.Property(n => n.Id).ValueGeneratedNever();

    e.Property(n => n.UserId).IsRequired();
    e.Property(n => n.Title).IsRequired().HasMaxLength(200);
    e.Property(n => n.Message).IsRequired();
    e.Property(n => n.Type).IsRequired().HasMaxLength(20);
    e.Property(n => n.RelatedEntityType).HasMaxLength(50);
    e.Property(n => n.IsRead).HasDefaultValue(false);
    e.Property(n => n.CreatedAt).IsRequired().HasDefaultValueSql("GETUTCDATE()");

    e.HasIndex(n => new { n.UserId, n.IsRead }).HasDatabaseName("IX_Notifications_UserId_IsRead");

    e.HasOne(n => n.User)
        .WithMany()
        .HasForeignKey(n => n.UserId)
        .OnDelete(DeleteBehavior.Cascade)
        .HasConstraintName("FK_Notifications_Users");

    e.HasQueryFilter(n => n.User.DeletedAt == null);
  }
}
