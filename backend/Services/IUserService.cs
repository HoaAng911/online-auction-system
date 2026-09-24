using backend.DTOs.User;

namespace backend.Services;

public interface IUserService
{
  Task<UserProfileDto> GetMeAsync(Guid userId);
  Task<UserProfileDto> UpdateMeAsync(Guid userId, UpdateProfileDto dto);
  Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
  Task<List<UserProfileDto>> GetAllAsync(string? search, int page, int pageSize);
  Task<UserProfileDto> UpdateStatusAsync(Guid targetUserId, Guid adminId, bool isActive);
}
