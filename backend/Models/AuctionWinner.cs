using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Bảng AuctionWinners — người thắng đấu giá (Module 2 — Long, nhưng Hằng cần để liên kết Payment).
/// Tạo bản tối thiểu ở đây để Module 3 có thể build độc lập.
/// Khi Long hoàn thiện module của mình, file này sẽ được mở rộng (thêm navigation tới Product/Bid).
/// Thiết kế gốc: TAI-LIEU-KY-THUAT-BACKEND.md mục 2.3.
/// </summary>
public class AuctionWinner
{
  public Guid Id { get; set; } = Guid.NewGuid();

  /// <summary>FK logic → Products(Id) của Long. Tạm chưa ràng buộc FK vật lý.</summary>
  public Guid ProductId { get; set; }

  public Guid WinnerId { get; set; }

  /// <summary>FK logic → Bids(Id) của Long.</summary>
  public Guid WinningBidId { get; set; }

  public decimal WinningPrice { get; set; }

  public DateTime WonAt { get; set; } = DateTime.UtcNow;

  [Required, MaxLength(20)]
  public string Status { get; set; } = AuctionWinnerStatus.Pending;

  // Navigation
  public User Winner { get; set; } = null!;
  public Payment? Payment { get; set; }
}

public static class AuctionWinnerStatus
{
  public const string Pending = "Pending";
  public const string Paid = "Paid";
  public const string Completed = "Completed";
  public const string Cancelled = "Cancelled";
  public static readonly string[] All = [Pending, Paid, Completed, Cancelled];
  public static bool IsValid(string? s) => s is not null && Array.IndexOf(All, s) >= 0;
}
