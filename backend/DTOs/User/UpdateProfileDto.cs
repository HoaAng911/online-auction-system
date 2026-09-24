using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.User;

public class UpdateProfileDto
{
  [StringLength(100, MinimumLength = 2, ErrorMessage = "Họ tên 2-100 ký tự")]
  public string? FullName { get; set; }

  [RegularExpression(@"^(0|\+84)\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ")]
  public string? Phone { get; set; }

  [MaxLength(255)]
  public string? Address { get; set; }

  [MaxLength(500)]
  public string? AvatarUrl { get; set; }
}
