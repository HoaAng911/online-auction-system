using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

/// <summary>
/// Cấu hình bảng UserVerificationTokens (Module 1 — Hoàng).
/// Thiết kế chi tiết: THIET-KE-BANG-MODULE-HOANG.md mục 4 và 6.2.
/// </summary>
public class UserVerificationTokenConfiguration : IEntityTypeConfiguration<UserVerificationToken>
{
    public void Configure(EntityTypeBuilder<UserVerificationToken> e)
    {
        // Gộp tên bảng và check constraint trong một lần gọi ToTable.
        // Gọi ToTable() hai lần sẽ ghi đè, làm mất CK_UserVerificationTokens_Type.
        e.ToTable("UserVerificationTokens", t => t.HasCheckConstraint(
            "CK_UserVerificationTokens_Type", "[Type] IN ('EmailVerify','PasswordReset')"));

        e.HasKey(t => t.Id).HasName("PK_UserVerificationTokens");
        e.Property(t => t.Id).ValueGeneratedNever();

        e.Property(t => t.UserId).IsRequired();
        e.Property(t => t.Token).IsRequired().HasMaxLength(255);
        e.Property(t => t.Type).IsRequired().HasMaxLength(20);
        e.Property(t => t.ExpiresAt).IsRequired();
        e.Property(t => t.IsUsed).HasDefaultValue(false);

        e.Property(t => t.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        e.HasIndex(t => t.Token)
            .IsUnique()
            .HasDatabaseName("UQ_UserVerificationTokens_Token");

        // Tìm và vô hiệu hóa token cũ theo user và loại.
        e.HasIndex(t => new { t.UserId, t.Type })
            .HasDatabaseName("IX_UserVerificationTokens_UserId_Type");

        e.HasOne(t => t.User)
            .WithMany(u => u.VerificationTokens)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_UserVerificationTokens_Users");

        e.HasQueryFilter(t => t.User.DeletedAt == null);
    }
}