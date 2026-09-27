# LUỒNG CODE CHI TIẾT — MODULE 1: XÁC THỰC & NGƯỜI DÙNG (Hoàng)

**Phạm vi:** luồng code end-to-end cho xác thực (đăng ký, đăng nhập, refresh token,
xác thực email, quên/đặt lại mật khẩu) và quản lý người dùng (hồ sơ, phân quyền, khóa/mở).

**Công nghệ:** ASP.NET Core Web API (.NET 8), EF Core, SQL Server, JWT, BCrypt.
**Frontend:** React + Axios interceptor tự refresh token.

**Tài liệu thiết kế bảng:** `THIET-KE-BANG-MODULE-HOANG.md`

---

## MỤC LỤC

1. [Tổng quan kiến trúc luồng](#1-tổng-quan-kiến-trúc-luồng)
2. [Đăng ký tài khoản](#2-đăng-ký-tài-khoản)
3. [Đăng nhập](#3-đăng-nhập)
4. [Refresh token (xoay vòng)](#4-refresh-token-xoay-vòng)
5. [Đăng xuất](#5-đăng-xuất)
6. [Xác thực email](#6-xác-thực-email)
7. [Quên & đặt lại mật khẩu](#7-quên--đặt-lại-mật-khẩu)
8. [Quản lý hồ sơ & phân quyền](#8-quản-lý-hồ-sơ--phân-quyền)
9. [Cơ chế audit & xóa mềm trong luồng code](#9-cơ-chế-audit--xóa-mềm-trong-luồng-code)
10. [Luồng phía Frontend](#10-luồng-phía-frontend)
11. [Bảng endpoint tóm tắt](#11-bảng-endpoint-tóm-tắt)

---

## 1. TỔNG QUAN KIẾN TRÚC LUỒNG

```
[Frontend React]
   │  authService.js / userService.js
   ▼
[Axios api.js] ── gắn Bearer token, tự refresh khi 401 ──┐
   │                                                     │
   ▼                                                     │
[AuthController / UserController]  (route, validate DTO)│
   │                                                     │
   ▼                                                     │
[IAuthService / IUserService]  (nghiệp vụ)              │
   │                                                     │
   ├─► [JwtHelper]      sinh access token JWT            │
   ├─► [PasswordHelper] hash/verify BCrypt               │
   ├─► [TokenGeneratorHelper] sinh token ngẫu nhiên      │
   ├─► [EmailService]   mô phỏng gửi email (log)         │
   │                                                     │
   ▼                                                     │
[AppDbContext] ── ghi audit tự động, xóa mềm ──► [SQL Server]
   │
   ▼
[ExceptionMiddleware] ── bắt AppException, trả ApiResponse chuẩn
```

**Nguyên tắc chung:**
- Mọi lỗi nghiệp vụ đều `throw new AppException(message, statusCode)` → [`ExceptionMiddleware`](backend/Middlewares/ExceptionMiddleware.cs:27) bắt và trả JSON `{ success, message, data, errors }`.
- Mọi response thành công bọc trong [`ApiResponse<T>`](backend/DTOs/Common/ApiResponse.cs:7).
- Khóa chính `Guid` (UUID v4) sinh ở tầng ứng dụng bằng `Guid.NewGuid()`, cấu hình `ValueGeneratedNever()`.

---

## 2. ĐĂNG KÝ TÀI KHOẢN

**Endpoint:** `POST /api/auth/register` — [`AuthController.Register`](backend/Controllers/AuthController.cs:21)

### Luồng từng bước

1. **Validate DTO** — [`RegisterDto`](backend/DTOs/Auth/RegisterDto.cs:5)
   - Username: regex `^[a-zA-Z0-9_.]{3,50}$`
   - Email: `[EmailAddress]`, max 100
   - Password: min 8, có chữ hoa + chữ thường + số
   - Phone: regex `^(0|\+84)\d{9}$`
   - Lỗi validation → `ApiBehaviorOptions.InvalidModelStateResponseFactory` trong [`Program.cs`](backend/Program.cs:19) trả 400 với cấu trúc ApiResponse.

2. **Gọi [`AuthService.RegisterAsync`](backend/Services/AuthService.cs:28)**
   - Chuẩn hóa: `email.Trim().ToLowerInvariant()`, `username.Trim()`.
   - Kiểm tra trùng: `AnyAsync(u => u.Email == email)` và `AnyAsync(u => u.Username == username)` → nếu trùng `throw new AppException(..., 400)`.

3. **Tạo `User`**
   - `PasswordHash = PasswordHelper.Hash(dto.Password)` (BCrypt)
   - `Role = Roles.User`, `IsActive = true`, `IsEmailVerified = false`
   - `Id = Guid.NewGuid()` (UUID v4, gán trong entity)
   - `_db.Users.Add(user)`

4. **Tạo `UserVerificationToken`**
   - `Token = TokenGeneratorHelper.GenerateVerificationToken()` (32 byte → Base64Url 43 ký tự)
   - `Type = VerificationTokenType.EmailVerify`
   - `ExpiresAt = UtcNow + 24 giờ`

5. **`SaveChangesAsync()`** — [`AppDbContext.ApplyAuditInfo`](backend/Data/AppDbContext.cs:74)
   - `CreatedAt = now`, `CreatedBy = null` (chưa đăng nhập)
   - Lưu cả `User` và `UserVerificationToken` trong 1 transaction.

6. **Gửi email xác thực** — [`EmailService.SendVerificationEmailAsync`](backend/Services/EmailService.cs:23)
   - Mô phỏng: ghi log link `{ClientUrl}/verify-email?token={token}`.

7. **Cấp token ngay** — [`IssueTokensAsync`](backend/Services/AuthService.cs:215)
   - Sinh access token JWT + refresh token mới.
   - Trả `AuthResponseDto { AccessToken, RefreshToken, AccessTokenExpiresAt, User }`.

> **Lưu ý:** Đăng ký đã trả token nên người dùng đăng nhập luôn được, nhưng `IsEmailVerified = false` → các thao tác nhạy cảm có thể bị chặn (điểm cần chốt, mục 9 tài liệu thiết kế).

---

## 3. ĐĂNG NHẬP

**Endpoint:** `POST /api/auth/login` — [`AuthController.Login`](backend/Controllers/AuthController.cs:29)

### Thứ tự kiểm tra trong [`AuthService.LoginAsync`](backend/Services/AuthService.cs:67)

| #   | Điều kiện                                 | Hành động                                                                                                                     | Mã lỗi |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Không tìm thấy user (Username hoặc Email) | `throw AppException("Sai thông tin đăng nhập")`                                                                               | 401    |
| 2   | `!user.IsActive`                          | `throw AppException("Tài khoản đã bị khóa")`                                                                                  | 403    |
| 3   | `LockoutEnd > UtcNow`                     | `throw AppException("Tài khoản tạm khóa đến ...")`                                                                            | 403    |
| 4   | Sai mật khẩu                              | `FailedLoginCount++`; nếu ≥ 5 → `LockoutEnd = UtcNow + 15 phút`, reset count; `throw AppException("Sai thông tin đăng nhập")` | 401    |
| 5   | Đúng mật khẩu                             | `FailedLoginCount = 0`, `LockoutEnd = null`, `SaveChangesAsync()`                                                             | —      |
| 6   | Cập nhật `LastLoginAt`                    | `ExecuteUpdateAsync` (không qua SaveChanges → không làm đổi `UpdatedAt`)                                                      | —      |
| 7   | Cấp token                                 | [`IssueTokensAsync`](backend/Services/AuthService.cs:215)                                                                     | 200    |

> **Bảo mật:** thông báo lỗi bước 1 và bước 4 giống hệt nhau → không lộ tài khoản nào tồn tại.

### [`IssueTokensAsync`](backend/Services/AuthService.cs:215) chi tiết

```
accessToken  = JwtHelper.GenerateToken(user)      → JWT 30 phút (Jwt:AccessTokenMinutes)
refreshToken = TokenGeneratorHelper.GenerateRefreshToken()  → 64 byte Base64Url
RefreshToken row: UserId, Token, ExpiresAt = UtcNow + Jwt:RefreshTokenDays (mặc định 7), CreatedByIp
return AuthResponseDto { AccessToken, RefreshToken, AccessTokenExpiresAt, User: UserInfoDto }
```

Claims trong JWT ([`JwtHelper`](backend/Helpers/JwtHelper.cs:25)):
- `NameIdentifier` = `user.Id` (chuỗi GUID)
- `Name` = Username, `Email`, `Role`

---

## 4. REFRESH TOKEN (XOAY VÒNG)

**Endpoint:** `POST /api/auth/refresh-token` — [`AuthController.RefreshToken`](backend/Controllers/AuthController.cs:37)

### Luồng trong [`AuthService.RefreshTokenAsync`](backend/Services/AuthService.cs:109)

```
1. Tìm RefreshToken theo Token (kèm Include(User))
   └─ không thấy → 401 "Refresh token không hợp lệ"
2. stored.IsRevoked == true → 401 "đã hết hiệu lực"
3. stored.ExpiresAt <= UtcNow → 401 "đã hết hạn"
4. user.IsActive == false || user.DeletedAt != null → 403
5. user.LockoutEnd > UtcNow → 403
6. IssueTokensAsync(user, ip)  → cấp cặp MỚI
7. stored.IsRevoked = true; stored.RevokedAt = UtcNow; SaveChanges
8. trả AuthResponseDto mới
```

> **Phát hiện dùng lại token:** nếu token đã revoked mà bị gửi lại, hiện tại trả 401 trực tiếp.
> Thiết kế (`THIET-KE-BANG-MODULE-HOANG.md` mục 3.3) đề xuất thu hồi toàn bộ token của user
> khi token revoked có `ReplacedByTokenId` — chưa được cài đặt đầy đủ (điểm cần chốt).

---

## 5. ĐĂNG XUẤT

**Endpoint:** `POST /api/auth/logout` — [`AuthController.Logout`](backend/Controllers/AuthController.cs:43) (`[Authorize]`)

[`AuthService.LogoutAsync`](backend/Services/AuthService.cs:140):
- Tìm token, nếu đã revoked thì return (idempotent).
- Đặt `IsRevoked = true`, `RevokedAt = UtcNow`.
- Frontend luôn gọi `tokenStorage.clear()` trong `finally`.

---

## 6. XÁC THỰC EMAIL

**Endpoint:** `POST /api/auth/verify-email` — [`AuthController.VerifyEmail`](backend/Controllers/AuthController.cs:51)

[`AuthService.VerifyEmailAsync`](backend/Services/AuthService.cs:151):

```
Truy vấn UserVerificationTokens WHERE
   Token = token
   AND Type = EmailVerify          ← bắt buộc, tránh token reset-password bị dùng sai
   AND IsUsed = false
   AND ExpiresAt > UtcNow
└─ null → 400 "Token không hợp lệ hoặc đã hết hạn"

stored.IsUsed = true; stored.UsedAt = UtcNow;
stored.User.IsEmailVerified = true;
SaveChangesAsync()
```

> Token không bị xóa dòng, chỉ đặt `IsUsed = true` để giữ lịch sử.

---

## 7. QUÊN & ĐẶT LẠI MẬT KHẨU

### 7.1 Quên mật khẩu — `POST /api/auth/forgot-password`

[`AuthService.ForgotPasswordAsync`](backend/Services/AuthService.cs:168):

```
1. normalized = email.Trim().ToLowerInvariant()
2. Tìm user theo Email
   └─ không thấy → return (KHÔNG throw)  ← luôn trả cùng thông báo, không lộ email
3. Đánh dấu IsUsed = true cho mọi token PasswordReset chưa dùng của user này
4. Tạo token mới: Type = PasswordReset, ExpiresAt = UtcNow + 1 giờ
5. SaveChangesAsync()
6. EmailService.SendPasswordResetEmailAsync → log link {ClientUrl}/reset-password?token=...
```

### 7.2 Đặt lại mật khẩu — `POST /api/auth/reset-password`

[`AuthService.ResetPasswordAsync`](backend/Services/AuthService.cs:194):

```
1. Truy vấn token WHERE Token + Type=PasswordReset + !IsUsed + ExpiresAt > UtcNow
   └─ null → 400
2. stored.IsUsed = true; stored.UsedAt = UtcNow
3. stored.User.PasswordHash = PasswordHelper.Hash(newPassword)
4. stored.User.FailedLoginCount = 0; LockoutEnd = null
5. SaveChangesAsync()
6. RevokeAllUserTokensAsync(userId)  ← buộc đăng nhập lại mọi thiết bị
```

[`RevokeAllUserTokensAsync`](backend/Services/AuthService.cs:247) dùng `ExecuteUpdateAsync`
để thu hồi hàng loạt không qua ChangeTracker.

---

## 8. QUẢN LÝ HỒ SƠ & PHÂN QUYỀN

**Controller:** [`UserController`](backend/Controllers/UserController.cs:10) — route `api/users`

| Endpoint                             | Quyền                        | Service method                                              |
| ------------------------------------ | ---------------------------- | ----------------------------------------------------------- |
| `GET /api/users/me`                  | `[Authorize]`                | [`GetMeAsync`](backend/Services/UserService.cs:16)          |
| `PUT /api/users/me`                  | `[Authorize]`                | [`UpdateMeAsync`](backend/Services/UserService.cs:23)       |
| `POST /api/users/me/change-password` | `[Authorize]`                | [`ChangePasswordAsync`](backend/Services/UserService.cs:37) |
| `GET /api/users`                     | `[Authorize(Roles="Admin")]` | [`GetAllAsync`](backend/Services/UserService.cs:56)         |
| `PUT /api/users/{id}/status`         | `[Authorize(Roles="Admin")]` | [`UpdateStatusAsync`](backend/Services/UserService.cs:93)   |

### Lấy `CurrentUserId` từ JWT

[`UserController.CurrentUserId`](backend/Controllers/UserController.cs:18):
```csharp
var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
```

### Đổi mật khẩu — [`ChangePasswordAsync`](backend/Services/UserService.cs:37)

```
1. Tìm user theo userId (query filter tự loại user đã xóa)
2. PasswordHelper.Verify(currentPassword, user.PasswordHash) → sai → 400
3. user.PasswordHash = PasswordHelper.Hash(newPassword); SaveChanges
4. ExecuteUpdateAsync thu hồi toàn bộ RefreshTokens chưa revoked của user
```

### Khóa/mở tài khoản — [`UpdateStatusAsync`](backend/Services/UserService.cs:93)

```
1. targetUserId == adminId → 400 "Không thể tự khóa chính mình"
2. _db.Users.IgnoreQueryFilters().FirstOrDefault(...)  ← xem cả user đã xóa mềm
3. user.DeletedAt != null → 400 "Tài khoản đã bị xóa"
4. user.IsActive = isActive; SaveChanges
5. Nếu isActive == false → thu hồi toàn bộ RefreshTokens của user
6. Trả ToDto(user)
```

### Phân quyền

- Hằng [`Roles`](backend/Models/Roles.cs): `User`, `Seller`, `Admin`.
- `RegisterDto` không có trường `Role` → luôn gán `Roles.User`.
- `Program.cs` seed Admin mặc định với `Role = Roles.Admin`.

---

## 9. CƠ CHẾ AUDIT & XÓA MỀM TRONG LUỒNG CODE

**Vị trí:** [`AppDbContext.ApplyAuditInfo`](backend/Data/AppDbContext.cs:74), chạy trong
`SaveChangesAsync`/`SaveChanges` trước khi ghi DB.

| EntityState | Hành động                                                                |
| ----------- | ------------------------------------------------------------------------ |
| `Added`     | `CreatedAt = now` (nếu chưa có), `CreatedBy = userId`                    |
| `Modified`  | `UpdatedAt = now`, `UpdatedBy = userId`                                  |
| `Deleted`   | Đổi `entry.State = Modified`, gán `DeletedAt`, `DeletedBy` → **xóa mềm** |

- `userId` đọc từ claim `NameIdentifier` qua [`GetCurrentUserId`](backend/Data/AppDbContext.cs:52)
  (`Guid.TryParse`, trả `null` khi seed/migration).
- **Global query filter:** [`UserConfiguration`](backend/Data/Configurations/UserConfiguration.cs:80)
  `HasQueryFilter(u => u.DeletedAt == null)` → mọi truy vấn mặc định bỏ user đã xóa.
  Truy vấn Admin cần xem cả user đã xóa dùng `.IgnoreQueryFilters()`.
- **Lưu ý:** `ON DELETE CASCADE` không chạy khi xóa mềm → service phải tự thu hồi
  `RefreshTokens` (đã làm ở `ChangePasswordAsync`, `UpdateStatusAsync`, `ResetPasswordAsync`).

---

## 10. LUỒNG PHÍA FRONTEND

### 10.1 Gọi API — [`authService.js`](frontend/src/services/authService.js:4)

```js
login(payload)   → POST /auth/login   → tokenStorage.set(accessToken, refreshToken)
register(payload)→ POST /auth/register → tokenStorage.set(...)
logout()         → POST /auth/logout   → tokenStorage.clear() (finally)
verifyEmail(token), forgotPassword(email), resetPassword(token, newPassword)
```

### 10.2 Axios interceptor — [`api.js`](frontend/src/services/api.js:28)

- **Request:** gắn `Authorization: Bearer {accessToken}` từ `localStorage`.
- **Response:** khi gặp **401** (không phải refresh/logout, chưa retry):
  1. Nếu đang có refresh đang chạy → đưa request vào `queue`, chờ token mới.
  2. Gọi `POST /auth/refresh-token` với `refreshToken`.
  3. Thành công → `tokenStorage.set(...)`, dispatch event `auth:refreshed`, retry request cũ.
  4. Thất bại → `tokenStorage.clear()`, dispatch event `auth:logout`.

### 10.3 Trạng thái đăng nhập — [`AuthContext.jsx`](frontend/src/context/AuthContext.jsx:17)

```
boot():
  - có access token? → decodeJwt() lấy role nhanh (render guard không cần gọi API)
  - fetchMe() → GET /api/users/me → setUser
  - lắng nghe event 'auth:logout' → setUser(null)
  - lắng nghe event 'auth:refreshed' → fetchMe()

login/register → authService → setUser(res.data.user)
logout         → authService.logout() → setUser(null)

value = { user, loading, isAuthenticated, isAdmin, login, register, logout, refreshMe }
```

---

## 11. BẢNG ENDPOINT TÓM TẮT

| Method | Route                           | Quyền     | Xử lý chính                                                 |
| ------ | ------------------------------- | --------- | ----------------------------------------------------------- |
| POST   | `/api/auth/register`            | Anonymous | Validate → tạo User + VerificationToken → email → cấp token |
| POST   | `/api/auth/login`               | Anonymous | Kiểm tra IsActive/Lockout/Password → cấp token              |
| POST   | `/api/auth/refresh-token`       | Anonymous | Xác thực refresh token → cấp cặp mới, revoke cũ             |
| POST   | `/api/auth/logout`              | Authorize | Revoke refresh token                                        |
| POST   | `/api/auth/verify-email`        | Anonymous | Đánh dấu token used, `IsEmailVerified = true`               |
| POST   | `/api/auth/forgot-password`     | Anonymous | Tạo token PasswordReset (1h), luôn trả cùng thông báo       |
| POST   | `/api/auth/reset-password`      | Anonymous | Đổi hash, revoke toàn bộ refresh token                      |
| GET    | `/api/users/me`                 | Authorize | Lấy hồ sơ hiện tại                                          |
| PUT    | `/api/users/me`                 | Authorize | Cập nhật FullName/Phone/Address/AvatarUrl                   |
| POST   | `/api/users/me/change-password` | Authorize | Verify old → đổi hash → revoke token                        |
| GET    | `/api/users`                    | Admin     | Tìm kiếm + phân trang                                       |
| PUT    | `/api/users/{id}/status`        | Admin     | Khóa/mở, revoke token khi khóa                              |

---

## GHI CHÚ PHỐI HỢP

- **Kiểu `Id`:** mọi bảng module này dùng `Guid` (UUID v4). Module Long/Hằng phải khai báo
  khóa ngoại trỏ vào `Users(Id)` kiểu `Guid` (danh sách cột trong `THIET-KE-BANG-MODULE-HOANG.md` mục 1.4).
- **Global query filter `User`:** entity có quan hệ bắt buộc tới `User` cần lưu ý khi user đã xóa
  (dùng `.IgnoreQueryFilters()` hoặc chỉ lấy `UserId` khi hiển thị lịch sử).
- **`AppDbContext` file chung:** chỉ thêm `DbSet` ở cuối khối module của mình (xem `GITHUB-WORKFLOW-RULES.md` mục 8).
