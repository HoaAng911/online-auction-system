using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.User;

public class ChangePasswordDto
{
  [Required(ErrorMessage = "Mật khẩu hiện tại là bắt buộc")]
  public string CurrentPassword { get; set; } = string.Empty;

  [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
  [MinLength(8, ErrorMessage = "Mật khẩu tối thiểu 8 ký tự")]
  [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$",
      ErrorMessage = "Mật khẩu phải có chữ hoa, chữ thường và số")]
  public string NewPassword { get; set; } = string.Empty;
}
