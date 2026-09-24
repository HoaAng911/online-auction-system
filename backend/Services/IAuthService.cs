using backend.DTOs.Auth;

namespace backend.Services;

public interface IAuthService
{
  Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string? ip);
  Task<AuthResponseDto> LoginAsync(LoginDto dto, string? ip);
  Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string? ip);
  Task LogoutAsync(string refreshToken);
  Task VerifyEmailAsync(string token);
  Task ForgotPasswordAsync(string email);
  Task ResetPasswordAsync(string token, string newPassword);
}
