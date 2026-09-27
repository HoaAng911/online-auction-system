using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Setting;

public class SettingDto
{
  public Guid Id { get; set; }
  public string Key { get; set; } = string.Empty;
  public string Value { get; set; } = string.Empty;
  public string? Description { get; set; }
  public DateTime UpdatedAt { get; set; }
}

public class UpdateSettingDto
{
  [Required(ErrorMessage = "Value là bắt buộc")]
  public string Value { get; set; } = string.Empty;

  [MaxLength(255)]
  public string? Description { get; set; }
}

public class UpsertSettingDto
{
  [Required, MaxLength(100)]
  public string Key { get; set; } = string.Empty;

  [Required]
  public string Value { get; set; } = string.Empty;

  [MaxLength(255)]
  public string? Description { get; set; }
}
