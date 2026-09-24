using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

/// <summary>
/// Cấu hình bảng Users (Module 1 — Hoàng).
/// Tách riêng khỏi AppDbContext để mỗi thành viên tự quản lý file cấu hình
/// tương ứng với các bảng thuộc module của mình, tránh conflict khi merge.
/// Thiết kế chi tiết: THIET-KE-BANG-MODULE-HOANG.md mục 2 và 6.2.
/// </summary>
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> e)
    {
        // Gộp tên bảng và check constraint trong một lần gọi ToTable.
        // Gọi ToTable() hai lần sẽ ghi đè, làm mất CK_Users_Role.
        e.ToTable("Users", t => t.HasCheckConstraint(
            "CK_Users_Role", "[Role] IN ('User','Seller','Admin')"));

        // Id do ứng dụng sinh bằng Guid.NewGuid() (UUID v4), không để EF sinh GUID tuần tự.
        e.HasKey(u => u.Id).HasName("PK_Users");
        e.Property(u => u.Id).ValueGeneratedNever();

        e.Property(u => u.Username).IsRequired().HasMaxLength(50);
        e.Property(u => u.Email).IsRequired().HasMaxLength(100);
        e.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
        e.Property(u => u.FullName).IsRequired().HasMaxLength(100);
        e.Property(u => u.Phone).HasMaxLength(20);
        e.Property(u => u.Address).HasMaxLength(255);
        e.Property(u => u.AvatarUrl).HasMaxLength(500);

        e.Property(u => u.Role)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue(Roles.User);

        e.Property(u => u.IsActive).HasDefaultValue(true);
        e.Property(u => u.IsEmailVerified).HasDefaultValue(false);
        e.Property(u => u.FailedLoginCount).HasDefaultValue(0);

        e.Property(u => u.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        // Unique chỉ áp dụng cho tài khoản chưa xóa, để email/username của
        // tài khoản đã xóa mềm có thể đăng ký lại (mục 2.4).
        e.HasIndex(u => u.Email)
            .IsUnique()
            .HasFilter("[DeletedAt] IS NULL")
            .HasDatabaseName("UQ_Users_Email");

        e.HasIndex(u => u.Username)
            .IsUnique()
            .HasFilter("[DeletedAt] IS NULL")
            .HasDatabaseName("UQ_Users_Username");

        // Tự tham chiếu cho các cột audit, không cascade.
        e.HasOne<User>()
            .WithMany()
            .HasForeignKey(u => u.CreatedBy)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_Users_CreatedBy");

        e.HasOne<User>()
            .WithMany()
            .HasForeignKey(u => u.UpdatedBy)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_Users_UpdatedBy");

        e.HasOne<User>()
            .WithMany()
            .HasForeignKey(u => u.DeletedBy)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_Users_DeletedBy");

        // Global query filter: mọi truy vấn mặc định bỏ qua user đã xóa mềm.
        // Truy vấn Admin cần xem cả user đã xóa thì dùng .IgnoreQueryFilters().
        e.HasQueryFilter(u => u.DeletedAt == null);
    }
}