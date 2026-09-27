using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations;

/// <summary>Cấu hình bảng Payments (Module 3 — Hằng).</summary>
public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
  public void Configure(EntityTypeBuilder<Payment> e)
  {
    e.ToTable("Payments", t =>
    {
      t.HasCheckConstraint("CK_Payments_Amount", "[Amount] > 0");
      t.HasCheckConstraint("CK_Payments_Status", "[Status] IN ('Pending','Success','Failed')");
      t.HasCheckConstraint("CK_Payments_Method", "[PaymentMethod] IN ('VNPay','Momo','COD','BankTransfer')");
    });

    e.HasKey(p => p.Id).HasName("PK_Payments");
    e.Property(p => p.Id).ValueGeneratedNever();

    e.Property(p => p.AuctionWinnerId).IsRequired();
    e.Property(p => p.PaymentMethod).IsRequired().HasMaxLength(50);
    e.Property(p => p.Amount).IsRequired().HasColumnType("decimal(18,2)");
    e.Property(p => p.TransactionId).HasMaxLength(100);
    e.Property(p => p.Status).IsRequired().HasMaxLength(20).HasDefaultValue(PaymentStatus.Pending);
    e.Property(p => p.CreatedAt).IsRequired().HasDefaultValueSql("GETUTCDATE()");

    e.HasIndex(p => p.AuctionWinnerId).IsUnique().HasDatabaseName("UQ_Payments_AuctionWinnerId");
    e.HasIndex(p => p.TransactionId).IsUnique().HasFilter("[TransactionId] IS NOT NULL").HasDatabaseName("UQ_Payments_TransactionId");

    e.HasOne(p => p.AuctionWinner)
        .WithOne(a => a.Payment)
        .HasForeignKey<Payment>(p => p.AuctionWinnerId)
        .OnDelete(DeleteBehavior.NoAction)
        .HasConstraintName("FK_Payments_AuctionWinners");

    // Khớp với global query filter của AuctionWinner để tránh cảnh báo EF Core
    // về required navigation bị lọc (giống cách RefreshTokenConfiguration làm với User).
    e.HasQueryFilter(p => p.AuctionWinner.Winner.DeletedAt == null);
  }
}
