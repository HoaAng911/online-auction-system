using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Bảng RefreshTokens — token làm mới phiên đăng nhập.
/// Thiết kế chi tiết: THIET-KE-BANG-MODULE-HOANG.md mục 3.
/// Bảng này không có audit đầy đủ 6 cột (hệ thống tự sinh, không ai sửa/xóa),
/// trạng thái thể hiện qua IsRevoked/RevokedAt.
/// </summary>
public class RefreshToken
{
    /// <summary>Khóa chính UUID v4, sinh ở tầng ứng dụng.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    /// <summary>
    /// Sinh bằng RandomNumberGenerator 64 byte, mã hóa Base64Url. Nên lưu SHA-256 hash
    /// thay vì token thô (mục 9, điểm 5) — client giữ bản gốc.
    /// </summary>
    [Required, MaxLength(500)]
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public bool IsRevoked { get; set; }

    public DateTime? RevokedAt { get; set; }

    /// <summary>IP lúc phát hành, 45 ký tự đủ cho IPv6.</summary>
    [MaxLength(45)]
    public string? CreatedByIp { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;

    /// <summary>
    /// Thuộc tính tính toán, không ánh xạ vào CSDL.
    /// Đặt tên IsValid để không nhầm với User.IsActive.
    /// </summary>
    [NotMapped]
    public bool IsValid => !IsRevoked && DateTime.UtcNow < ExpiresAt;
}