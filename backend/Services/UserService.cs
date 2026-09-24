using backend.Data;
using backend.DTOs.User;
using backend.Helpers;
using backend.Middlewares;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class UserService : IUserService
{
  private readonly AppDbContext _db;

  public UserService(AppDbContext db) => _db = db;

  public async Task<UserProfileDto> GetMeAsync(Guid userId)
  {
    var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
        ?? throw new AppException("Không tìm thấy người dùng", 404);
    return ToDto(user);
  }

  public async Task<UserProfileDto> UpdateMeAsync(Guid userId, UpdateProfileDto dto)
  {
    var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
        ?? throw new AppException("Không tìm thấy người dùng", 404);

    if (dto.FullName is not null) user.FullName = dto.FullName.Trim();
    if (dto.Phone is not null) user.Phone = dto.Phone.Trim();
    if (dto.Address is not null) user.Address = dto.Address.Trim();
    if (dto.AvatarUrl is not null) user.AvatarUrl = dto.AvatarUrl.Trim();

    await _db.SaveChangesAsync();
    return ToDto(user);
  }

  public async Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
  {
    var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
        ?? throw new AppException("Không tìm thấy người dùng", 404);

    if (!PasswordHelper.Verify(currentPassword, user.PasswordHash))
      throw new AppException("Mật khẩu hiện tại không đúng", 400);

    user.PasswordHash = PasswordHelper.Hash(newPassword);
    await _db.SaveChangesAsync();

    var now = DateTime.UtcNow;
    await _db.RefreshTokens
        .Where(r => r.UserId == userId && !r.IsRevoked)
        .ExecuteUpdateAsync(s => s
            .SetProperty(r => r.IsRevoked, true)
            .SetProperty(r => r.RevokedAt, now));
  }

  public async Task<List<UserProfileDto>> GetAllAsync(string? search, int page, int pageSize)
  {
    page = Math.Max(page, 1);
    pageSize = Math.Clamp(pageSize, 1, 100);

    var query = _db.Users.AsQueryable();
    if (!string.IsNullOrWhiteSpace(search))
    {
      var s = search.Trim().ToLower();
      query = query.Where(u => u.Username.ToLower().Contains(s)
          || u.Email.ToLower().Contains(s)
          || u.FullName.ToLower().Contains(s));
    }

    return await query
        .OrderByDescending(u => u.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(u => new UserProfileDto
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
        })
        .ToListAsync();
  }

  public async Task<UserProfileDto> UpdateStatusAsync(Guid targetUserId, Guid adminId, bool isActive)
  {
    if (targetUserId == adminId)
      throw new AppException("Không thể tự khóa chính mình", 400);

    var user = await _db.Users.IgnoreQueryFilters()
        .FirstOrDefaultAsync(u => u.Id == targetUserId)
        ?? throw new AppException("Không tìm thấy người dùng", 404);

    if (user.DeletedAt.HasValue)
      throw new AppException("Tài khoản đã bị xóa", 400);

    user.IsActive = isActive;
    await _db.SaveChangesAsync();

    if (!isActive)
    {
      var now = DateTime.UtcNow;
      await _db.RefreshTokens
          .Where(r => r.UserId == targetUserId && !r.IsRevoked)
          .ExecuteUpdateAsync(s => s
              .SetProperty(r => r.IsRevoked, true)
              .SetProperty(r => r.RevokedAt, now));
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
