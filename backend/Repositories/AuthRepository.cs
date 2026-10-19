using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class AuthRepository : IAuthRepository
{
    private readonly AppDbContext _db;

    public AuthRepository(AppDbContext db) => _db = db;

    public Task<bool> EmailExistsAsync(string email) =>
        _db.Users.AnyAsync(user => user.Email == email);

    public Task<bool> UsernameExistsAsync(string username) =>
        _db.Users.AnyAsync(user => user.Username == username);

    public void AddUser(User user) => _db.Users.Add(user);

    public void AddVerificationToken(UserVerificationToken token) =>
        _db.UserVerificationTokens.Add(token);

    public Task<User?> GetUserForLoginAsync(string usernameOrEmail, string email) =>
        _db.Users.FirstOrDefaultAsync(user =>
            user.Username == usernameOrEmail || user.Email == email);

    public async Task UpdateLastLoginAsync(Guid userId, DateTime lastLoginAt)
    {
        await _db.Users
            .Where(user => user.Id == userId)
            .ExecuteUpdateAsync(update =>
                update.SetProperty(user => user.LastLoginAt, lastLoginAt));
    }

    public Task<RefreshToken?> GetRefreshTokenWithUserAsync(string token) =>
        _db.RefreshTokens
            .Include(refreshToken => refreshToken.User)
            .FirstOrDefaultAsync(refreshToken => refreshToken.Token == token);

    public Task<RefreshToken?> GetRefreshTokenAsync(string token) =>
        _db.RefreshTokens.FirstOrDefaultAsync(refreshToken => refreshToken.Token == token);

    public void AddRefreshToken(RefreshToken token) => _db.RefreshTokens.Add(token);

    public Task<UserVerificationToken?> GetValidVerificationTokenAsync(
        string token,
        string type,
        DateTime now) =>
        _db.UserVerificationTokens
            .Include(verificationToken => verificationToken.User)
            .FirstOrDefaultAsync(verificationToken =>
                verificationToken.Token == token
                && verificationToken.Type == type
                && !verificationToken.IsUsed
                && verificationToken.ExpiresAt > now);

    public Task<User?> GetUserByEmailAsync(string email) =>
        _db.Users.FirstOrDefaultAsync(user => user.Email == email);

    public Task<List<UserVerificationToken>> GetUnusedVerificationTokensAsync(
        Guid userId,
        string type) =>
        _db.UserVerificationTokens
            .Where(token =>
                token.UserId == userId
                && token.Type == type
                && !token.IsUsed)
            .ToListAsync();

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
