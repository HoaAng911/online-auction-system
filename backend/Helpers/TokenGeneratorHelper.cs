using System.Security.Cryptography;
using Microsoft.AspNetCore.WebUtilities;

namespace backend.Helpers;

/// <summary>
/// Sinh token ngẫu nhiên an toàn cho refresh token và verification token.
/// </summary>
public static class TokenGeneratorHelper
{
  /// <summary>64 byte -> Base64Url ~86 ký tự, dùng cho refresh token.</summary>
  public static string GenerateRefreshToken()
  {
    var bytes = RandomNumberGenerator.GetBytes(64);
    return WebEncoders.Base64UrlEncode(bytes);
  }

  /// <summary>32 byte -> Base64Url 43 ký tự, dùng cho email verify / reset password.</summary>
  public static string GenerateVerificationToken()
  {
    var bytes = RandomNumberGenerator.GetBytes(32);
    return WebEncoders.Base64UrlEncode(bytes);
  }
}
