using backend.DTOs.Auth;
using backend.DTOs.Common;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
  private readonly IAuthService _auth;

  public AuthController(IAuthService auth) => _auth = auth;

  private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

  [HttpPost("register")]
  [AllowAnonymous]
  public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
  {
    var result = await _auth.RegisterAsync(dto, ClientIp);
    return StatusCode(201, ApiResponse<AuthResponseDto>.Ok(result, "Đăng ký thành công"));
  }

  [HttpPost("login")]
  [AllowAnonymous]
  public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
  {
    var result = await _auth.LoginAsync(dto, ClientIp);
    return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Đăng nhập thành công"));
  }

  [HttpPost("refresh-token")]
  [AllowAnonymous]
  public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenDto dto)
  {
    var result = await _auth.RefreshTokenAsync(dto.RefreshToken, ClientIp);
    return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Làm mới token thành công"));
  }

  [HttpPost("logout")]
  [Authorize]
  public async Task<ActionResult<ApiResponse<object>>> Logout([FromBody] RefreshTokenDto dto)
  {
    await _auth.LogoutAsync(dto.RefreshToken);
    return Ok(ApiResponse<object>.Ok(null, "Đăng xuất thành công"));
  }

  [HttpPost("verify-email")]
  [AllowAnonymous]
  public async Task<ActionResult<ApiResponse<object>>> VerifyEmail([FromBody] VerifyEmailDto dto)
  {
    await _auth.VerifyEmailAsync(dto.Token);
    return Ok(ApiResponse<object>.Ok(null, "Xác thực email thành công"));
  }

  [HttpPost("forgot-password")]
  [AllowAnonymous]
  public async Task<ActionResult<ApiResponse<object>>> ForgotPassword([FromBody] ForgotPasswordDto dto)
  {
    await _auth.ForgotPasswordAsync(dto.Email);
    return Ok(ApiResponse<object>.Ok(null, "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi"));
  }

  [HttpPost("reset-password")]
  [AllowAnonymous]
  public async Task<ActionResult<ApiResponse<object>>> ResetPassword([FromBody] ResetPasswordDto dto)
  {
    await _auth.ResetPasswordAsync(dto.Token, dto.NewPassword);
    return Ok(ApiResponse<object>.Ok(null, "Đặt lại mật khẩu thành công"));
  }
}
