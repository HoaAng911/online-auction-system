using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

/// <summary>Cấu hình bảng Reviews (Module 3 — Hằng).</summary>
public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
  public void Configure(EntityTypeBuilder<Review> e)
  {
    e.ToTable("Reviews", t => t.HasCheckConstraint("CK_Reviews_Rating", "[Rating] BETWEEN 1 AND 5"));

    e.HasKey(r => r.Id).HasName("PK_Reviews");
    e.Property(r => r.Id).ValueGeneratedNever();

    e.Property(r => r.ProductId).IsRequired();
    e.Property(r => r.ReviewerId).IsRequired();
    e.Property(r => r.Rating).IsRequired();
    e.Property(r => r.CreatedAt).IsRequired().HasDefaultValueSql("GETUTCDATE()");

    // Mỗi người chỉ đánh giá một sản phẩm một lần.
    e.HasIndex(r => new { r.ProductId, r.ReviewerId }).IsUnique().HasDatabaseName("UQ_Reviews_ProductReviewer");

    e.HasOne(r => r.Reviewer)
        .WithMany()
        .HasForeignKey(r => r.ReviewerId)
        .OnDelete(DeleteBehavior.NoAction)
        .HasConstraintName("FK_Reviews_Users");

    // FK tới Products sẽ bổ sung khi Long tạo bảng Products.
    e.HasQueryFilter(r => r.DeletedAt == null && r.Reviewer.DeletedAt == null);
  }
}
