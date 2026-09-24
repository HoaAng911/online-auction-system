using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth;

public class VerifyEmailDto
{
  [Required(ErrorMessage = "Token là bắt buộc")]
  public string Token { get; set; } = string.Empty;
}
