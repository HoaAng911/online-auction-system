using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

/// <summary>
/// Cấu hình bảng AuctionWinners — bản tối thiểu cho Module 3.
/// Khi Long hoàn thiện module Products/Bids sẽ mở rộng thêm FK tới Products/Bids.
/// </summary>
public class AuctionWinnerConfiguration : IEntityTypeConfiguration<AuctionWinner>
{
  public void Configure(EntityTypeBuilder<AuctionWinner> e)
  {
    e.ToTable("AuctionWinners", t => t.HasCheckConstraint(
        "CK_AuctionWinners_Status", "[Status] IN ('Pending','Paid','Completed','Cancelled')"));

    e.HasKey(a => a.Id).HasName("PK_AuctionWinners");
    e.Property(a => a.Id).ValueGeneratedNever();

    e.Property(a => a.ProductId).IsRequired();
    e.Property(a => a.WinnerId).IsRequired();
    e.Property(a => a.WinningBidId).IsRequired();
    e.Property(a => a.WinningPrice).IsRequired().HasColumnType("decimal(18,2)");
    e.Property(a => a.WonAt).IsRequired().HasDefaultValueSql("GETUTCDATE()");
    e.Property(a => a.Status).IsRequired().HasMaxLength(20).HasDefaultValue(AuctionWinnerStatus.Pending);

    e.HasIndex(a => a.ProductId).IsUnique().HasDatabaseName("UQ_AuctionWinners_ProductId");

    e.HasOne(a => a.Winner)
        .WithMany()
        .HasForeignKey(a => a.WinnerId)
        .OnDelete(DeleteBehavior.NoAction)
        .HasConstraintName("FK_AuctionWinners_Users");

    e.HasQueryFilter(a => a.Winner.DeletedAt == null);
  }
}
