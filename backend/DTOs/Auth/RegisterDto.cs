using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth;

public class RegisterDto
{
  [Required(ErrorMessage = "Username là bắt buộc")]
  [StringLength(50, MinimumLength = 3, ErrorMessage = "Username 3-50 ký tự")]
  [RegularExpression(@"^[a-zA-Z0-9_.]{3,50}$", ErrorMessage = "Username chỉ gồm chữ, số, _ và .")]
  public string Username { get; set; } = string.Empty;

  [Required(ErrorMessage = "Email là bắt buộc")]
  [EmailAddress(ErrorMessage = "Email không hợp lệ")]
  [MaxLength(100)]
  public string Email { get; set; } = string.Empty;

  [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
  [MinLength(8, ErrorMessage = "Mật khẩu tối thiểu 8 ký tự")]
  [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$",
      ErrorMessage = "Mật khẩu phải có chữ hoa, chữ thường và số")]
  public string Password { get; set; } = string.Empty;

  [Required(ErrorMessage = "Họ tên là bắt buộc")]
  [StringLength(100, MinimumLength = 2, ErrorMessage = "Họ tên 2-100 ký tự")]
  public string FullName { get; set; } = string.Empty;

  [RegularExpression(@"^(0|\+84)\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ")]
  public string? Phone { get; set; }

  [MaxLength(255)]
  public string? Address { get; set; }
}
