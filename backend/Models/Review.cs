using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Bảng Reviews — đánh giá sau giao dịch (Module 3 — Hằng).
/// Thiết kế gốc: TAI-LIEU-KY-THUAT-BACKEND.md mục 2.3.
/// ProductId tạm thời là Guid tự do (chưa FK vì bảng Products do Long phụ trách chưa có).
/// Khi Long tạo bảng Products sẽ bổ sung FK + navigation sau.
/// </summary>
public class Review : AuditableEntity
{
  public Guid Id { get; set; } = Guid.NewGuid();

  /// <summary>FK logic → Products(Id) của Long. Tạm chưa ràng buộc FK vật lý.</summary>
  public Guid ProductId { get; set; }

  public Guid ReviewerId { get; set; }

  [Range(1, 5)]
  public int Rating { get; set; }

  public string? Comment { get; set; }

  // Navigation
  public User Reviewer { get; set; } = null!;
}
