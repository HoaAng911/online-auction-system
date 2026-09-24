using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Bảng UserVerificationTokens — xác thực email và đặt lại mật khẩu.
/// Thiết kế chi tiết: THIET-KE-BANG-MODULE-HOANG.md mục 4.
/// Không xóa dòng sau khi dùng, chỉ đặt IsUsed = true để giữ lịch sử.
/// </summary>
public class UserVerificationToken
{
    /// <summary>Khóa chính UUID v4, sinh ở tầng ứng dụng.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    /// <summary>
    /// Sinh 32 byte ngẫu nhiên bằng RandomNumberGenerator, mã hóa Base64Url
    /// (43 ký tự, an toàn khi đặt trong link email).
    /// </summary>
    [Required, MaxLength(255)]
    public string Token { get; set; } = string.Empty;

    /// <summary>Chỉ nhận VerificationTokenType.EmailVerify / PasswordReset.</summary>
    [Required, MaxLength(20)]
    public string Type { get; set; } = string.Empty;

    /// <summary>EmailVerify = +24 giờ, PasswordReset = +1 giờ.</summary>
    public DateTime ExpiresAt { get; set; }

    public bool IsUsed { get; set; }

    public DateTime? UsedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
}