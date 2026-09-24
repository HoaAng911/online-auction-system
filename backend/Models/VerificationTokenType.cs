namespace backend.Models;

/// <summary>
/// Loại token xác thực. Dùng hằng thay vì chuỗi trực tiếp.
/// Khớp với check constraint CK_UserVerificationTokens_Type (THIET-KE-BANG-MODULE-HOANG.md mục 4.1).
/// </summary>
public static class VerificationTokenType
{
    public const string EmailVerify = "EmailVerify";
    public const string PasswordReset = "PasswordReset";

    public static readonly string[] All = [EmailVerify, PasswordReset];

    public static bool IsValid(string? type) => type is not null && Array.IndexOf(All, type) >= 0;
}