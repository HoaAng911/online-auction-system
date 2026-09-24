using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models;

/// <summary>
/// Bảng Users — người dùng và phân quyền.
/// Thiết kế chi tiết: THIET-KE-BANG-MODULE-HOANG.md mục 2.
/// </summary>
public class User : AuditableEntity
{
    /// <summary>Khóa chính UUID v4, sinh ở tầng ứng dụng.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    /// <summary>Hash BCrypt. Không bao giờ trả ra ngoài (đã có [JsonIgnore]).</summary>
    [Required, MaxLength(255), JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    /// <summary>Chỉ nhận Roles.User / Roles.Seller / Roles.Admin.</summary>
    [Required, MaxLength(20)]
    public string Role { get; set; } = Roles.User;

    /// <summary>false nghĩa là bị Admin khóa (có thể mở lại).</summary>
    public bool IsActive { get; set; } = true;

    public bool IsEmailVerified { get; set; }

    /// <summary>Thời điểm đăng nhập gần nhất.</summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>Đếm số lần sai mật khẩu liên tiếp, reset về 0 khi đăng nhập đúng.</summary>
    public int FailedLoginCount { get; set; }

    /// <summary>Khóa tạm thời tự động khi sai mật khẩu quá nhiều. Khác IsActive (Admin khóa).</summary>
    public DateTime? LockoutEnd { get; set; }

    // Navigation
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<UserVerificationToken> VerificationTokens { get; set; } = new List<UserVerificationToken>();
}