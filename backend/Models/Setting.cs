using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Bảng Settings — cấu hình hệ thống (Module 3 — Hằng).
/// </summary>
public class Setting
{
  public Guid Id { get; set; } = Guid.NewGuid();

  [Required, MaxLength(100)]
  public string Key { get; set; } = string.Empty;

  [Required]
  public string Value { get; set; } = string.Empty;

  [MaxLength(255)]
  public string? Description { get; set; }

  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Các key cấu hình mặc định.</summary>
public static class SettingKeys
{
  public const string CommissionRate = "CommissionRate";
  public const string MinBidAmount = "MinBidAmount";
  public static readonly string[] All = [CommissionRate, MinBidAmount];
}
