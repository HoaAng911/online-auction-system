using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth;

public class ResetPasswordDto
{
  [Required(ErrorMessage = "Token là bắt buộc")]
  public string Token { get; set; } = string.Empty;

  [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
  [MinLength(8, ErrorMessage = "Mật khẩu tối thiểu 8 ký tự")]
  [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$",
      ErrorMessage = "Mật khẩu phải có chữ hoa, chữ thường và số")]
  public string NewPassword { get; set; } = string.Empty;
}
