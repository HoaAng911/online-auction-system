using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth;

public class LoginDto
{
  [Required(ErrorMessage = "Tên đăng nhập hoặc email là bắt buộc")]
  public string UsernameOrEmail { get; set; } = string.Empty;

  [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
  public string Password { get; set; } = string.Empty;
}
