using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.User;

public class UpdateUserStatusDto
{
  [Required(ErrorMessage = "Trạng thái là bắt buộc")]
  public bool IsActive { get; set; }
}
