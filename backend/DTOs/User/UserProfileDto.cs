namespace backend.DTOs.User;

public class UserProfileDto
{
  public Guid Id { get; set; }
  public string Username { get; set; } = string.Empty;
  public string Email { get; set; } = string.Empty;
  public string FullName { get; set; } = string.Empty;
  public string? Phone { get; set; }
  public string? Address { get; set; }
  public string? AvatarUrl { get; set; }
  public string Role { get; set; } = string.Empty;
  public bool IsActive { get; set; }
  public bool IsEmailVerified { get; set; }
  public DateTime? LastLoginAt { get; set; }
  public DateTime CreatedAt { get; set; }
  public DateTime? UpdatedAt { get; set; }
}
