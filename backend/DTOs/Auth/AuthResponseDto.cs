namespace backend.DTOs.Auth;

public class AuthResponseDto
{
  public string AccessToken { get; set; } = string.Empty;
  public string RefreshToken { get; set; } = string.Empty;
  public DateTime AccessTokenExpiresAt { get; set; }
  public UserInfoDto User { get; set; } = null!;
}

public class UserInfoDto
{
  public Guid Id { get; set; }
  public string Username { get; set; } = string.Empty;
  public string Email { get; set; } = string.Empty;
  public string FullName { get; set; } = string.Empty;
  public string Role { get; set; } = string.Empty;
  public bool IsEmailVerified { get; set; }
}
