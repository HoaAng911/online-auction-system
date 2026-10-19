using backend.Models;

namespace backend.Repositories;

public interface IAuthRepository
{
    Task<bool> EmailExistsAsync(string email);

    Task<bool> UsernameExistsAsync(string username);

    void AddUser(User user);

    void AddVerificationToken(UserVerificationToken token);

    Task<User?> GetUserForLoginAsync(string usernameOrEmail, string email);

    Task UpdateLastLoginAsync(Guid userId, DateTime lastLoginAt);

    Task<RefreshToken?> GetRefreshTokenWithUserAsync(string token);

    Task<RefreshToken?> GetRefreshTokenAsync(string token);

    void AddRefreshToken(RefreshToken token);

    Task<UserVerificationToken?> GetValidVerificationTokenAsync(
        string token,
        string type,
        DateTime now);

    Task<User?> GetUserByEmailAsync(string email);

    Task<List<UserVerificationToken>> GetUnusedVerificationTokensAsync(
        Guid userId,
        string type);

    Task RevokeActiveRefreshTokensAsync(Guid userId, DateTime revokedAt);

    Task<int> SaveChangesAsync();
}
