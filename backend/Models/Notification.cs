using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Bảng Notifications — thông báo hệ thống (Module 3 — Hằng).
/// Thiết kế gốc: TAI-LIEU-KY-THUAT-BACKEND.md mục 2.3.
/// </summary>
public class Notification
{
  public Guid Id { get; set; } = Guid.NewGuid();

  public Guid UserId { get; set; }

  [Required, MaxLength(200)]
  public string Title { get; set; } = string.Empty;

  [Required]
  public string Message { get; set; } = string.Empty;

  [Required, MaxLength(20)]
  public string Type { get; set; } = string.Empty;

  [MaxLength(50)]
  public string? RelatedEntityType { get; set; }

  public Guid? RelatedEntityId { get; set; }

  public bool IsRead { get; set; }

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation
  public User User { get; set; } = null!;
}

/// <summary>Loại thông báo.</summary>
public static class NotificationType
{
  public const string OutBid = "OutBid";
  public const string Won = "Won";
  public const string ProductApproved = "ProductApproved";
  public const string ProductRejected = "ProductRejected";
  public const string PaymentSuccess = "PaymentSuccess";
  public const string ReviewReceived = "ReviewReceived";
  public static readonly string[] All = [OutBid, Won, ProductApproved, ProductRejected, PaymentSuccess, ReviewReceived];
  public static bool IsValid(string? t) => t is not null && Array.IndexOf(All, t) >= 0;
}
