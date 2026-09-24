using System.Security.Claims;
using backend.DTOs.Common;
using backend.DTOs.User;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
  private readonly IUserService _users;

  public UserController(IUserService users) => _users = users;

  private Guid CurrentUserId
  {
    get
    {
      var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
      return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
    }
  }

  [HttpGet("me")]
  [Authorize]
  public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetMe()
  {
    var result = await _users.GetMeAsync(CurrentUserId);
    return Ok(ApiResponse<UserProfileDto>.Ok(result));
  }

  [HttpPut("me")]
  [Authorize]
  public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateMe([FromBody] UpdateProfileDto dto)
  {
    var result = await _users.UpdateMeAsync(CurrentUserId, dto);
    return Ok(ApiResponse<UserProfileDto>.Ok(result, "Cập nhật hồ sơ thành công"));
  }

  [HttpPost("me/change-password")]
  [Authorize]
  public async Task<ActionResult<ApiResponse<object>>> ChangePassword([FromBody] ChangePasswordDto dto)
  {
    await _users.ChangePasswordAsync(CurrentUserId, dto.CurrentPassword, dto.NewPassword);
    return Ok(ApiResponse<object>.Ok(null, "Đổi mật khẩu thành công"));
  }

  [HttpGet]
  [Authorize(Roles = "Admin")]
  public async Task<ActionResult<ApiResponse<List<UserProfileDto>>>> GetAll(
      [FromQuery] string? search,
      [FromQuery] int page = 1,
      [FromQuery] int pageSize = 20)
  {
    var result = await _users.GetAllAsync(search, page, pageSize);
    return Ok(ApiResponse<List<UserProfileDto>>.Ok(result));
  }

  [HttpPut("{id:guid}/status")]
  [Authorize(Roles = "Admin")]
  public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateStatus(
      Guid id, [FromBody] UpdateUserStatusDto dto)
  {
    var result = await _users.UpdateStatusAsync(id, CurrentUserId, dto.IsActive);
    return Ok(ApiResponse<UserProfileDto>.Ok(result, dto.IsActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản"));
  }
}
