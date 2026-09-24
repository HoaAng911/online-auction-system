namespace backend.Models;

/// <summary>
/// Danh sách Role hợp lệ. Dùng hằng thay vì chuỗi trực tiếp để tránh sai chính tả.
/// Khớp với check constraint CK_Users_Role (THIET-KE-BANG-MODULE-HOANG.md mục 2.1).
/// </summary>
public static class Roles
{
    public const string User = "User";
    public const string Seller = "Seller";
    public const string Admin = "Admin";

    /// <summary>Danh sách dùng cho check constraint và kiểm tra hợp lệ ở tầng service.</summary>
    public static readonly string[] All = [User, Seller, Admin];

    public static bool IsValid(string? role) => role is not null && Array.IndexOf(All, role) >= 0;
}