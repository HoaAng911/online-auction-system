using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db) => _db = db;

    public Task<User?> GetByIdAsync(Guid userId) =>
        _db.Users.FirstOrDefaultAsync(user => user.Id == userId);

    public Task<User?> GetByIdIncludingDeletedAsync(Guid userId) =>
        _db.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(user => user.Id == userId);

    public Task<List<User>> GetAllAsync(string? search, int skip, int take)
    {
        var query = _db.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLower();
            query = query.Where(user =>
                user.Username.ToLower().Contains(normalizedSearch)
                || user.Email.ToLower().Contains(normalizedSearch)
                || user.FullName.ToLower().Contains(normalizedSearch));
        }

        return query
            .OrderByDescending(user => user.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task RevokeActiveRefreshTokensAsync(Guid userId, DateTime revokedAt)
    {
        await _db.RefreshTokens
            .Where(token => token.UserId == userId && !token.IsRevoked)
            .ExecuteUpdateAsync(update => update
                .SetProperty(token => token.IsRevoked, true)
                .SetProperty(token => token.RevokedAt, revokedAt));
    }

    public Task<int> SaveChangesAsync() => _db.SaveChangesAsync();
}
