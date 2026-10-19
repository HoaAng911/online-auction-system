using backend.Models;

namespace backend.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid userId);

    Task<User?> GetByIdIncludingDeletedAsync(Guid userId);

    Task<List<User>> GetAllAsync(string? search, int skip, int take);

    Task RevokeActiveRefreshTokensAsync(Guid userId, DateTime revokedAt);

    Task<int> SaveChangesAsync();
}
