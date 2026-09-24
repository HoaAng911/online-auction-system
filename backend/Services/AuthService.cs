using backend.Data;
using backend.DTOs.Auth;
using backend.Helpers;
using backend.Middlewares;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class AuthService : IAuthService
{
  private const int MaxFailedLogin = 5;
  private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

  private readonly AppDbContext _db;
  private readonly JwtHelper _jwt;
  private readonly IEmailService _email;
  private readonly IConfiguration _config;

  public AuthService(AppDbContext db, JwtHelper jwt, IEmailService email, IConfiguration config)
  {
    _db = db;
    _jwt = jwt;
    _email = email;
    _config = config;
  }

  public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string? ip)
  {
    var email = dto.Email.Trim().ToLowerInvariant();
    var username = dto.Username.Trim();

    if (await _db.Users.AnyAsync(u => u.Email == email))
      throw new AppException("Email đã được sử dụng", 400);
    if (await _db.Users.AnyAsync(u => u.Username == username))
      throw new AppException("Username đã được sử dụng", 400);

    var user = new User
    {
      Username = username,
      Email = email,
      PasswordHash = PasswordHelper.Hash(dto.Password),
      FullName = dto.FullName.Trim(),
      Phone = dto.Phone?.Trim(),
      Address = dto.Address?.Trim(),
      Role = Roles.User,
      IsActive = true,
      IsEmailVerified = false
    };
    _db.Users.Add(user);

    var verifyToken = new UserVerificationToken
    {
      UserId = user.Id,
      Token = TokenGeneratorHelper.GenerateVerificationToken(),
      Type = VerificationTokenType.EmailVerify,
      ExpiresAt = DateTime.UtcNow.AddHours(24)
    };
    _db.UserVerificationTokens.Add(verifyToken);
    await _db.SaveChangesAsync();

    await _email.SendVerificationEmailAsync(email, verifyToken.Token);

    return await IssueTokensAsync(user, ip);
  }

  public async Task<AuthResponseDto> LoginAsync(LoginDto dto, string? ip)
  {
    var key = dto.UsernameOrEmail.Trim();
    var keyLower = key.ToLowerInvariant();

    var user = await _db.Users
        .FirstOrDefaultAsync(u => u.Username == key || u.Email == keyLower);

    // Thông báo chung để không lộ tài khoản nào tồn tại (mục 7.2).
    if (user is null)
      throw new AppException("Sai thông tin đăng nhập", 401);
    if (!user.IsActive)
      throw new AppException("Tài khoản đã bị khóa", 403);
    if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
      throw new AppException($"Tài khoản tạm khóa đến {user.LockoutEnd:HH:mm dd/MM/yyyy}", 403);

    if (!PasswordHelper.Verify(dto.Password, user.PasswordHash))
    {
      user.FailedLoginCount++;
      if (user.FailedLoginCount >= MaxFailedLogin)
      {
        user.LockoutEnd = DateTime.UtcNow.Add(LockoutDuration);
        user.FailedLoginCount = 0;
      }
      await _db.SaveChangesAsync();
      throw new AppException("Sai thông tin đăng nhập", 401);
    }

    user.FailedLoginCount = 0;
    user.LockoutEnd = null;
    await _db.SaveChangesAsync();

    var now = DateTime.UtcNow;
    await _db.Users.Where(u => u.Id == user.Id)
        .ExecuteUpdateAsync(s => s.SetProperty(u => u.LastLoginAt, now));

    return await IssueTokensAsync(user, ip);
  }

  /// <summary>
  /// Xoay vòng refresh token (rotation): token cũ bị thu hồi, cấp cặp token mới.
  /// </summary>
  public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string? ip)
  {
    var stored = await _db.RefreshTokens
        .Include(r => r.User)
        .FirstOrDefaultAsync(r => r.Token == refreshToken);

    if (stored is null)
      throw new AppException("Refresh token không hợp lệ", 401);

    if (stored.IsRevoked)
      throw new AppException("Refresh token đã hết hiệu lực", 401);

    if (stored.ExpiresAt <= DateTime.UtcNow)
      throw new AppException("Refresh token đã hết hạn", 401);

    var user = stored.User;
    if (!user.IsActive || user.DeletedAt.HasValue)
      throw new AppException("Tài khoản đã bị khóa hoặc không tồn tại", 403);
    if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
      throw new AppException("Tài khoản đang tạm khóa", 403);

    // Cấp cặp token mới, sau đó revoke token cũ.
    var result = await IssueTokensAsync(user, ip);

    stored.IsRevoked = true;
    stored.RevokedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();

    return result;
  }

  public async Task LogoutAsync(string refreshToken)
  {
    var stored = await _db.RefreshTokens
        .FirstOrDefaultAsync(r => r.Token == refreshToken);
    if (stored is null || stored.IsRevoked) return;

    stored.IsRevoked = true;
    stored.RevokedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();
  }

  public async Task VerifyEmailAsync(string token)
  {
    var stored = await _db.UserVerificationTokens
        .Include(t => t.User)
        .FirstOrDefaultAsync(t => t.Token == token
            && t.Type == VerificationTokenType.EmailVerify
            && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

    if (stored is null)
      throw new AppException("Token xác thực không hợp lệ hoặc đã hết hạn", 400);

    stored.IsUsed = true;
    stored.UsedAt = DateTime.UtcNow;
    stored.User.IsEmailVerified = true;
    await _db.SaveChangesAsync();
  }

  public async Task ForgotPasswordAsync(string email)
  {
    var normalized = email.Trim().ToLowerInvariant();
    var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalized);

    // Luôn trả cùng thông báo để không lộ email nào đã đăng ký (mục 4.3).
    if (user is null) return;

    var olds = await _db.UserVerificationTokens
        .Where(t => t.UserId == user.Id && t.Type == VerificationTokenType.PasswordReset && !t.IsUsed)
        .ToListAsync();
    foreach (var o in olds) o.IsUsed = true;

    var token = new UserVerificationToken
    {
      UserId = user.Id,
      Token = TokenGeneratorHelper.GenerateVerificationToken(),
      Type = VerificationTokenType.PasswordReset,
      ExpiresAt = DateTime.UtcNow.AddHours(1)
    };
    _db.UserVerificationTokens.Add(token);
    await _db.SaveChangesAsync();

    await _email.SendPasswordResetEmailAsync(user.Email, token.Token);
  }

  public async Task ResetPasswordAsync(string token, string newPassword)
  {
    var stored = await _db.UserVerificationTokens
        .Include(t => t.User)
        .FirstOrDefaultAsync(t => t.Token == token
            && t.Type == VerificationTokenType.PasswordReset
            && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

    if (stored is null)
      throw new AppException("Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn", 400);

    stored.IsUsed = true;
    stored.UsedAt = DateTime.UtcNow;
    stored.User.PasswordHash = PasswordHelper.Hash(newPassword);
    stored.User.FailedLoginCount = 0;
    stored.User.LockoutEnd = null;
    await _db.SaveChangesAsync();

    await RevokeAllUserTokensAsync(stored.UserId);
  }

  private async Task<AuthResponseDto> IssueTokensAsync(User user, string? ip)
  {
    var (accessToken, expiresAt) = _jwt.GenerateToken(user);
    var days = int.TryParse(_config["Jwt:RefreshTokenDays"], out var d) ? d : 7;

    var refresh = new RefreshToken
    {
      UserId = user.Id,
      Token = TokenGeneratorHelper.GenerateRefreshToken(),
      ExpiresAt = DateTime.UtcNow.AddDays(days),
      CreatedByIp = ip
    };
    _db.RefreshTokens.Add(refresh);
    await _db.SaveChangesAsync();

    return new AuthResponseDto
    {
      AccessToken = accessToken,
      RefreshToken = refresh.Token,
      AccessTokenExpiresAt = expiresAt,
      User = new UserInfoDto
      {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        FullName = user.FullName,
        Role = user.Role,
        IsEmailVerified = user.IsEmailVerified
      }
    };
  }

  private async Task RevokeAllUserTokensAsync(Guid userId)
  {
    var now = DateTime.UtcNow;
    await _db.RefreshTokens
        .Where(r => r.UserId == userId && !r.IsRevoked)
        .ExecuteUpdateAsync(s => s
            .SetProperty(r => r.IsRevoked, true)
            .SetProperty(r => r.RevokedAt, now));
  }
}
