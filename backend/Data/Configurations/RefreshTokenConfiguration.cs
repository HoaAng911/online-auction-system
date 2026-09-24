using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

/// <summary>
/// Cấu hình bảng RefreshTokens (Module 1 — Hoàng).
/// Thiết kế chi tiết: THIET-KE-BANG-MODULE-HOANG.md mục 3 và 6.2.
/// </summary>
public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> e)
    {
        e.ToTable("RefreshTokens");

        e.HasKey(r => r.Id).HasName("PK_RefreshTokens");
        e.Property(r => r.Id).ValueGeneratedNever();

        e.Property(r => r.UserId).IsRequired();
        e.Property(r => r.Token).IsRequired().HasMaxLength(500);
        e.Property(r => r.ExpiresAt).IsRequired();
        e.Property(r => r.IsRevoked).HasDefaultValue(false);
        e.Property(r => r.CreatedByIp).HasMaxLength(45);

        e.Property(r => r.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // UNIQUE trên Token đã tự tạo index, không cần IX_RefreshTokens_Token riêng.
        e.HasIndex(r => r.Token)
            .IsUnique()
            .HasDatabaseName("UQ_RefreshTokens_Token");

        // Dùng cho thao tác thu hồi toàn bộ token của một user.
        e.HasIndex(r => r.UserId)
            .HasDatabaseName("IX_RefreshTokens_UserId");

        e.HasOne(r => r.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_RefreshTokens_Users");

        // Khớp với global query filter của User để tránh cảnh báo của EF Core
        // về required navigation bị lọc (mục 6.2).
        e.HasQueryFilter(r => r.User.DeletedAt == null);
    }
}