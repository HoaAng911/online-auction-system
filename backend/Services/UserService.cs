using backend.DTOs.User;
using backend.Helpers;
using backend.Middlewares;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class UserService : IUserService
{
  private readonly IUserRepository _users;

  public UserService(IUserRepository users) => _users = users;

  public async Task<UserProfileDto> GetMeAsync(Guid userId)
  {
    var user = await _users.GetByIdAsync(userId)
        ?? throw new AppException("Không tìm thấy người dùng", 404);
    return ToDto(user);
  }

  public async Task<UserProfileDto> UpdateMeAsync(Guid userId, UpdateProfileDto dto)
  {
    var user = await _users.GetByIdAsync(userId)
        ?? throw new AppException("Không tìm thấy người dùng", 404);

    if (dto.FullName is not null) user.FullName = dto.FullName.Trim();
    if (dto.Phone is not null) user.Phone = dto.Phone.Trim();
    if (dto.Address is not null) user.Address = dto.Address.Trim();
    if (dto.AvatarUrl is not null) user.AvatarUrl = dto.AvatarUrl.Trim();

    await _users.SaveChangesAsync();
    return ToDto(user);
  }

  public async Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
  {
    var user = await _users.GetByIdAsync(userId)
        ?? throw new AppException("Không tìm thấy người dùng", 404);

    if (!PasswordHelper.Verify(currentPassword, user.PasswordHash))
      throw new AppException("Mật khẩu hiện tại không đúng", 400);

    user.PasswordHash = PasswordHelper.Hash(newPassword);
    await _users.SaveChangesAsync();

    var now = DateTime.UtcNow;
    await _users.RevokeActiveRefreshTokensAsync(userId, now);
  }

  public async Task<List<UserProfileDto>> GetAllAsync(string? search, int page, int pageSize)
  {
    page = Math.Max(page, 1);
    pageSize = Math.Clamp(pageSize, 1, 100);

    var users = await _users.GetAllAsync(search, (page - 1) * pageSize, pageSize);
    return users.Select(ToDto).ToList();
  }

  public async Task<UserProfileDto> UpdateStatusAsync(Guid targetUserId, Guid adminId, bool isActive)
  {
    if (targetUserId == adminId)
      throw new AppException("Không thể tự khóa chính mình", 400);

    var user = await _users.GetByIdIncludingDeletedAsync(targetUserId)
        ?? throw new AppException("Không tìm thấy người dùng", 404);

    if (user.DeletedAt.HasValue)
      throw new AppException("Tài khoản đã bị xóa", 400);

    user.IsActive = isActive;
    await _users.SaveChangesAsync();

    if (!isActive)
    {
      var now = DateTime.UtcNow;
      await _users.RevokeActiveRefreshTokensAsync(targetUserId, now);
    }

    return ToDto(user);
  }

  private static UserProfileDto ToDto(User u) => new()
  {
    Id = u.Id,
    Username = u.Username,
    Email = u.Email,
    FullName = u.FullName,
    Phone = u.Phone,
    Address = u.Address,
    AvatarUrl = u.AvatarUrl,
    Role = u.Role,
    IsActive = u.IsActive,
    IsEmailVerified = u.IsEmailVerified,
    LastLoginAt = u.LastLoginAt,
    CreatedAt = u.CreatedAt,
    UpdatedAt = u.UpdatedAt
  };
}
