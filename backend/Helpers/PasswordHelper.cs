namespace backend.Helpers;

/// <summary>
/// Bọc BCrypt để hash và kiểm tra mật khẩu. Không bao giờ log mật khẩu gốc (mục 7.5).
/// </summary>
public static class PasswordHelper
{
  public static string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);

  public static bool Verify(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}
