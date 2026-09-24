# Đánh giá cấu trúc Code Backend — Module 1 (Xác thực & Người dùng)

**Mục đích:** Trả lời câu hỏi *"Cấu trúc code backend hiện tại đã ổn chưa? Logic nào quá phức tạp so với đồ án môn học của sinh viên thì đơn giản hóa lại?"*

**Phạm vi review:** Toàn bộ thư mục `backend/` ở thời điểm 24/09/2026.

**Kết luận nhanh:** ✅ **Cấu trúc đã tốt, không cần đập đi làm lại.** Kiến trúc rõ ràng, tách tầng đúng chuẩn, bảo mật cơ bản đầy đủ — đủ sức ăn điểm cao cho đồ án.

> 🛠️ **CẬP NHẬT 24/09/2026 — đã thực thi đơn giản hóa 2 chỗ:**
> - ✅ Bỏ **reuse detection** của refresh token, giữ **rotation cơ bản** (mục 3.1).
> - ✅ Bỏ **dead branch `isOnlyLastLoginAt`** trong audit (mục 3.3).
> - Đã tạo migration [`SimplifyRefreshToken_DropChain`](backend/Migrations/20260924182848_SimplifyRefreshToken_DropChain.cs) để drop cột `ReplacedByTokenId`.
> - ✅ Build thành công.
>
> ⚠️ **Cần chạy `dotnet ef database update`** để áp migration vào DB (nhất là khi backend đang chạy — phải tắt trước).

---

## 1. Cấu trúc hiện tại — Đánh giá tổng thể

```
Controller  →  Service (interface + impl)  →  AppDbContext (EF Core)  →  SQL Server
```

| Tầng                 | Trạng thái | Nhận xét                                                                                     |
| -------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| **Controllers**      | ✅ Chuẩn    | Mỏng, chỉ nhận request → gọi service → trả `ApiResponse`. Không chứa business logic.         |
| **Services**         | ✅ Chuẩn    | Phân tách interface (`IAuthService`, `IUserService`) + implement. Đúng Dependency Injection. |
| **Data (DbContext)** | ✅ Tốt      | Tự động audit + soft delete tập trung một chỗ.                                               |
| **Configurations**   | ✅ Rất tốt  | Fluent API tách file riêng theo module → 3 người làm song song không conflict.               |
| **Models**           | ✅ Chuẩn    | Base class `AuditableEntity`, hằng số `Roles`/`VerificationTokenType` thay vì magic string.  |
| **DTOs**             | ✅ Chuẩn    | Tách `Auth/`, `User/`, `Common/` rõ ràng, có Data Annotation validate.                       |
| **Helpers**          | ✅ Gọn      | `JwtHelper`, `PasswordHelper`, `TokenGeneratorHelper` — mỗi file một việc.                   |
| **Middleware**       | ✅ Tốt      | `ExceptionMiddleware` bắt lỗi tập trung, không lộ stack trace.                               |

**Tổng điểm cấu trúc: 9/10 cho đồ án sinh viên.** Cách tổ chức này còn tốt hơn cả một số đồ án tốt nghiệp.

---

## 2. Điểm mạnh nên giữ nguyên (đừng sửa)

1. **Tách tầng Controller → Service → DbContext** — đúng chuẩn, dễ giải thích với giảng viên.
2. **Exception nghiệp vụ `AppException` + middleware** — một chỗ xử lý lỗi, trả về cùng cấu trúc `ApiResponse`.
3. **Soft delete + audit tự động** trong [`AppDbContext.ApplyAuditInfo()`](backend/Data/AppDbContext.cs:70) — service không phải gán tay từng cột.
4. **Validate input bằng Data Annotation** — gọn, ít code, giảng viên thấy ngay.
5. **Không hard-code secret** — JWT đọc từ config và throw nếu thiếu/quá ngắn.
6. **Index + Unique filter `[DeletedAt] IS NULL`** trong [`UserConfiguration`](backend/Data/Configurations/UserConfiguration.cs:49) — chi tiết này thể hiện hiểu sâu về soft delete.
7. **Cơ chế lockout** (sai 5 lần → khóa 15 phút) — bảo mật vừa đủ, dễ trình bày.
8. **Chống lộ thông tin**: login/forgot-password trả thông báo chung, `PasswordHash` có `[JsonIgnore]`.

---

## 3. ⚠️ Logic quá phức tạp — NÊN đơn giản hóa

> Tiêu chí: đồ án môn học không cần mức công nghiệp. Nếu giải thích mất > 3 phút thì nên gỡ.

### 3.1. ✅ (ĐÃ XỬ LÝ) Rotation + Reuse Detection của Refresh Token

> **Trạng thái:** đã bỏ reuse detection, giữ rotation cơ bản. Cột `ReplacedByTokenId` đã gỡ khỏi model + cấu hình, migration drop cột đã tạo.

**Vị trí:** [`AuthService.RefreshTokenAsync()`](backend/Services/AuthService.cs:119) (trước đây có `ReplacedByTokenId` trong `RefreshToken`).

**Hiện tại làm gì:**
- Khi refresh → phát hành token mới, đánh dấu token cũ `IsRevoked = true`.
- Gán `ReplacedByTokenId` để biết token cũ đã "biến thành" token nào.
- Nếu token cũ bị gửi lại → coi là bị đánh cắp → **thu hồi toàn bộ refresh token của user** (mọi thiết bị đăng xuất).

**Nhược điểm cho đồ án:**
- Phải giải thích khái niệm "refresh token chain", "reuse detection" — khá hàn lâm.
- Tốn thêm 1 cột + 1 self-reference FK + query `FirstAsync` lồng trong [`AuthService.cs:160`](backend/Services/AuthService.cs:160) chỉ để lấy Id token vừa tạo.
- Rủi ro bug: nếu `IssueTokensAsync` thành công nhưng `SaveChangesAsync` cuối fail thì dữ liệu lệch.

**✅ Đề xuất đơn giản hóa:** Giữ **rotation cơ bản**, bỏ **reuse detection**.

```csharp
public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string? ip)
{
    var stored = await _db.RefreshTokens
        .Include(r => r.User)
        .FirstOrDefaultAsync(r => r.Token == refreshToken);

    // 1. Không tìm thấy / đã thu hồi / hết hạn
    if (stored is null || stored.IsRevoked || stored.ExpiresAt <= DateTime.UtcNow)
        throw new AppException("Refresh token không hợp lệ hoặc đã hết hiệu lực", 401);

    // 2. Kiểm tra tài khoản còn hoạt động
    var user = stored.User;
    if (!user.IsActive || user.DeletedAt.HasValue)
        throw new AppException("Tài khoản đã bị khóa hoặc không tồn tại", 403);
    if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
        throw new AppException("Tài khoản đang tạm khóa", 403);

    // 3. Phát hành token mới rồi thu hồi token cũ (rotation cơ bản)
    var result = await IssueTokensAsync(user, ip);
    stored.IsRevoked = true;
    stored.RevokedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();

    return result;
}
```

**Cần làm thêm khi bỏ reuse detection:**
- Xóa cột `ReplacedByTokenId` khỏi `RefreshToken` → tạo migration mới.
- Xóa cấu hình quan hệ self-reference trong [`RefreshTokenConfiguration.cs:45`](backend/Data/Configurations/RefreshTokenConfiguration.cs:45).
- Xóa `RevokeAllUserTokensAsync` chỉ còn dùng ở `ResetPasswordAsync`/`ChangePasswordAsync`/`UpdateStatusAsync` (giữ vì đó là logic đơn giản, hợp lý).

> **Vẫn giữ được điểm bảo mật:** rotation cơ bản + thu hồi token khi đổi mật khẩu/khóa tài khoản là đủ "ấn tượng" cho đồ án.

### 3.2. 🟡 `ForgotPasswordAsync` chỉ để "báo chung" — có thể giữ nhưng nói rõ

**Vị trí:** [`AuthService.ForgotPasswordAsync()`](backend/Services/AuthService.cs:198) — khi email không tồn tại thì `return` luôn, không gửi mail.

**Nhận xét:** Đây **không phải over-engineer**, mà là bảo mật tốt (chống dò email). Giữ nguyên. Chỉ cần **comment rõ** trong báo cáo: "Luôn trả cùng message để không lộ email nào đã đăng ký". Code hiện tại đã có comment → ổn.

### 3.3. ✅ (ĐÃ XỬ LÝ) Kiểm tra `isOnlyLastLoginAt` trong `ApplyAuditInfo`

> **Trạng thái:** đã bỏ dead branch, `ApplyAuditInfo` giờ chỉ gán `UpdatedAt`/`UpdatedBy` cho mọi entry Modified.

**Vị trí:** [`AppDbContext.ApplyAuditInfo()`](backend/Data/AppDbContext.cs:93).

```csharp
var isOnlyLastLoginAt = entry.Properties.Count(p => p.IsModified) == 1
    && entry.Properties.Any(p => p.Metadata.Name == nameof(User.LastLoginAt) && p.IsModified);
```

**Vấn đề:** Logic này tồn tại vì `LastLoginAt` được gán bằng `ExecuteUpdateAsync` ở [`AuthService.cs:100`](backend/Services/AuthService.cs:100) — mà `ExecuteUpdateAsync` **không** kích hoạt `SaveChanges`/`ApplyAuditInfo`. Vậy làm sao entry lại "chỉ modified LastLoginAt"? Thực tế nhánh này gần như **không bao giờ chạy** với code hiện tại, gây khó hiểu khi đọc.

**✅ Đề xuất đơn giản hóa:**

```csharp
case EntityState.Modified:
    entry.Entity.UpdatedAt = now;
    entry.Entity.UpdatedBy = userId;
    break;
```

Bỏ đoạn `isOnlyLastLoginAt` (dead branch). Nếu ai đó gán `LastLoginAt` trực tiếp qua entity thì cứ để audit ghi `UpdatedAt` — chấp nhận được với đồ án. Việc `ExecuteUpdateAsync` không chạm `UpdatedAt` là đúng rồi.

> Sau khi bỏ, **nhớ cập nhật comment** trong [`User.cs:46`](backend/Models/User.cs:46) cho khỏi mâu thuẫn.

---

## 4. Điểm chưa hoàn thiện (nice-to-have, không bắt buộc)

| #   | Việc                                                     | Đánh giá cho đồ án                                             |
| --- | -------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Lưu **SHA-256 hash** của refresh token thay vì raw token | ⭐ Không cần. Raw token + DB nội bộ là đủ. Bỏ để đỡ phức tạp.   |
| 2   | `GetAllAsync` chưa trả `totalCount` cho phân trang       | ⭐ Nên thêm nhẹ — frontend cần để hiển thị tổng số trang Admin. |
| 3   | Chưa có **unit test**                                    | ⭐ Nên có 3-5 test cho `AuthService` để ăn điểm "kiểm thử".     |
| 4   | `EmailService` chỉ log, chưa gửi thật                    | ✅ Chấp nhận được, đồ án demo thì log là đủ.                    |
| 5   | Chưa có **rate limiting** cho login                      | ✅ Bỏ qua — đã có lockout 5 lần là đủ.                          |
| 6   | `appsettings.json` có `Seed:AdminPassword`               | 🟡 Nên đổi thành placeholder + ghi chú trong README.            |

---

## 5. Bảng tổng hợp hành động đề xuất

| Mức độ        | Việc cần làm                                            | File đụng tới                                                                                                                                                                                                               | Công sức |
| ------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| ✅ **ĐÃ XONG** | Bỏ reuse detection, giữ rotation cơ bản                 | [`AuthService.cs`](backend/Services/AuthService.cs:119), [`RefreshToken.cs`](backend/Models/RefreshToken.cs:33), [`RefreshTokenConfiguration.cs`](backend/Data/Configurations/RefreshTokenConfiguration.cs:45), + migration | —        |
| ✅ **ĐÃ XONG** | Đơn giản hóa nhánh `isOnlyLastLoginAt` (bỏ dead branch) | [`AppDbContext.cs`](backend/Data/AppDbContext.cs:93), comment [`User.cs`](backend/Models/User.cs:46)                                                                                                                        | —        |
| 🟢 Tùy chọn    | Thêm `totalCount` vào `GetAllAsync`                     | [`UserService.cs`](backend/Services/UserService.cs:56), `IUserService.cs`                                                                                                                                                   | ~20 phút |
| 🟢 Tùy chọn    | Đổi `Seed:AdminPassword` thành placeholder              | `appsettings.json`, README                                                                                                                                                                                                  | ~5 phút  |

---

## 6. Kết luận

- **Cấu trúc hiện tại OK, giữ nguyên.** Việc tách tầng, DI, middleware, validation, audit đều làm đúng — không cần đơn giản hóa triệt để, chỉ tinh chỉnh 2 điểm.
- **Thứ tự ưu tiên khi sửa:**
  1. Bỏ **reuse detection** (phức tạp nhất, khó bảo vệ nhất) → giữ rotation cơ bản.
  2. Bỏ **dead branch `isOnlyLastLoginAt`** → code audit gọn, dễ giải thích.
  3. (Tùy chọn) Thêm `totalCount` và vài unit test.
- Sau khi làm 2 việc đầu, code backend sẽ **vừa đủ "chuyên nghiệp" để ghi điểm, vừa đủ "dễ hiểu" để giảng viên hỏi gì cũng trả lời được**.

> 📌 Lưu ý khi bảo vệ: nếu giảng viên khen phần rotation thì có thể **giữ lại reuse detection** làm điểm cộng — tùy vào việc bạn có tự tin giải thích được cơ chế "refresh token chain" hay không. Nếu không chắc, hãy đơn giản hóa.
