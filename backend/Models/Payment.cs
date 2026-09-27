using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Bảng Payments — giao dịch thanh toán (Module 3 — Hằng).
/// Thiết kế gốc: TAI-LIEU-KY-THUAT-BACKEND.md mục 2.3.
/// Lưu ý: Id dùng Guid để đồng nhất với Users (thay vì INT trong tài liệu gốc).
/// </summary>
public class Payment
{
  public Guid Id { get; set; } = Guid.NewGuid();

  /// <summary>FK → AuctionWinners(Id), UNIQUE — mỗi phiên thắng chỉ có một payment.</summary>
  public Guid AuctionWinnerId { get; set; }

  [Required, MaxLength(50)]
  public string PaymentMethod { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  [MaxLength(100)]
  public string? TransactionId { get; set; }

  [Required, MaxLength(20)]
  public string Status { get; set; } = PaymentStatus.Pending;

  public DateTime? PaidAt { get; set; }

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation
  public AuctionWinner AuctionWinner { get; set; } = null!;
}

/// <summary>Trạng thái thanh toán.</summary>
public static class PaymentStatus
{
  public const string Pending = "Pending";
  public const string Success = "Success";
  public const string Failed = "Failed";
  public static readonly string[] All = [Pending, Success, Failed];
  public static bool IsValid(string? s) => s is not null && Array.IndexOf(All, s) >= 0;
}

/// <summary>Phương thức thanh toán hợp lệ.</summary>
public static class PaymentMethod
{
  public const string VNPay = "VNPay";
  public const string Momo = "Momo";
  public const string COD = "COD";
  public const string BankTransfer = "BankTransfer";
  public static readonly string[] All = [VNPay, Momo, COD, BankTransfer];
  public static bool IsValid(string? m) => m is not null && Array.IndexOf(All, m) >= 0;
}
