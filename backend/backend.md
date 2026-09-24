# Hướng dẫn Kiểm tra & Review Code Backend + Commit chuẩn

**Dành cho đồ án môn học – Sinh viên năm 4**

Tài liệu này hướng dẫn quy trình kiểm tra code backend, review code và cách commit sao cho rõ ràng, dễ hiểu, dễ theo dõi lịch sử dự án.

---

## 1. Mục tiêu

- Đảm bảo code backend đúng logic, an toàn, dễ bảo trì.
- Phát hiện lỗi sớm trước khi merge.
- Giữ lịch sử Git sạch, dễ đọc, dễ rollback.
- Thể hiện tính chuyên nghiệp trong đồ án.

---

## 2. Quy trình Kiểm tra Code Backend (Self-check trước khi nhờ review)

### 2.1. Kiểm tra chức năng
- [ ] API trả về đúng status code (200, 201, 400, 401, 403, 404, 500...)
- [ ] Dữ liệu trả về đúng format (JSON schema rõ ràng)
- [ ] Xử lý đầy đủ các trường hợp: thành công, thất bại, thiếu dữ liệu, dữ liệu sai
- [ ] Test các edge case (dữ liệu rỗng, số âm, chuỗi quá dài, injection...)

### 2.2. Kiểm tra bảo mật cơ bản
- [ ] Không hard-code password, API key, secret trong code
- [ ] Validate & sanitize input từ người dùng
- [ ] Sử dụng parameterized query / ORM để tránh SQL Injection
- [ ] Kiểm tra quyền truy cập (Authorization) trước khi xử lý dữ liệu nhạy cảm
- [ ] Không trả về thông tin nhạy cảm trong response lỗi (stack trace, đường dẫn file...)

### 2.3. Kiểm tra hiệu năng & chất lượng code
- [ ] Không có N+1 query
- [ ] Có index phù hợp cho các trường hay query
- [ ] Hàm/method không quá dài (nên < 50–70 dòng)
- [ ] Tên biến, hàm, class rõ nghĩa (tiếng Anh, theo convention của team)
- [ ] Có comment giải thích logic phức tạp (không comment thừa)
- [ ] Không để code chết (dead code) hoặc console.log / print debug

### 2.4. Kiểm tra cấu trúc & chuẩn code
- [ ] Tuân thủ coding convention (ESLint, Prettier, Black, golangci-lint...)
- [ ] Tách rõ tầng: Controller → Service → Repository
- [ ] Xử lý lỗi thống nhất (try-catch / error middleware)
- [ ] Có logging phù hợp (không log quá nhiều hoặc quá ít)

---

## 3. Quy trình Review Code

### 3.1. Người viết code (Author)
1. Tự kiểm tra theo checklist ở mục 2.
2. Chạy test (unit test + integration test nếu có).
3. Tạo Pull Request / Merge Request với mô tả rõ ràng.
4. Gắn reviewer và chờ feedback.

### 3.2. Người review (Reviewer)
Khi review, tập trung vào các điểm sau:

| Tiêu chí              | Câu hỏi cần trả lời                                      |
|-----------------------|----------------------------------------------------------|
| **Đúng chức năng**    | Code có giải quyết đúng yêu cầu không?                   |
| **An toàn**           | Có lỗ hổng bảo mật tiềm ẩn không?                        |
| **Dễ hiểu**           | Người khác đọc có hiểu nhanh không?                      |
| **Dễ bảo trì**        | Sau này sửa có khó không?                                |
| **Hiệu năng**         | Có query thừa hoặc logic kém hiệu quả không?             |
| **Tuân thủ chuẩn**    | Có theo convention của dự án không?                      |

**Cách đưa feedback tốt:**
- Chỉ rõ dòng code + lý do
- Đưa ra gợi ý cải thiện (không chỉ nói "sai")
- Phân biệt rõ: **Must fix** / **Should fix** / **Nice to have**

---

## 4. Quy tắc Commit cho dễ hiểu

### 4.1. Cấu trúc commit message chuẩn

```text
<type>(<scope>): <mô tả ngắn gọn>

[thân commit - giải thích lý do nếu cần]

[footer - reference issue nếu có]
```

### 4.2. Các type phổ biến

| Type       | Ý nghĩa                                      |
|------------|----------------------------------------------|
| `feat`     | Thêm tính năng mới                           |
| `fix`      | Sửa bug                                      |
| `refactor` | Cải tổ code (không thêm tính năng, không sửa bug) |
| `docs`     | Cập nhật tài liệu                            |
| `test`     | Thêm/sửa test                                |
| `chore`    | Cấu hình, dependencies, CI/CD...             |
| `style`    | Format, thiếu dấu chấm phẩy... (không đổi logic) |

### 4.3. Ví dụ commit tốt

```text
feat(auth): thêm endpoint refresh-token

Sinh JWT mới từ refresh token hợp lệ.
Cũ token bị đánh dấu IsRevoked để phát hiện tái sử dụng.

Closes #12
```

```text
fix(user): sửa lỗi admin tự khóa chính mình

UserService.UpdateStatusAsync kiểm tra targetUserId == adminId
và throw AppException 400 thay vì cho phép qua.
```

---

## 5. Kết quả Review Code Backend – Module 1 (Xác thực & Người dùng)

> Tự review theo checklist mục 2. Thực hiện ngày: 23/09/2026.

### 5.1. Kiểm tra chức năng ✅

| Endpoint | Status code | Ghi chú |
|---|---|---|
| `POST /api/auth/register` | 201 ✅ | Trả `AuthResponseDto` + gửi email xác thực |
| `POST /api/auth/login` | 200 / 401 / 403 ✅ | Xử lý lockout tạm thời sau 5 lần sai |
| `POST /api/auth/refresh-token` | 200 / 401 ✅ | Xoay vòng token, phát hiện tái dùng token cũ |
| `POST /api/auth/logout` | 200 ✅ | Thu hồi refresh token, yêu cầu `[Authorize]` |
| `POST /api/auth/verify-email` | 200 / 400 ✅ | Kiểm tra `ExpiresAt` và `IsUsed` |
| `POST /api/auth/forgot-password` | 200 ✅ | Luôn trả cùng thông báo (không lộ email) |
| `POST /api/auth/reset-password` | 200 / 400 ✅ | Thu hồi toàn bộ RefreshToken sau đặt lại |
| `GET /api/users/me` | 200 / 404 ✅ | Yêu cầu JWT hợp lệ |
| `PUT /api/users/me` | 200 / 404 ✅ | Chỉ cập nhật field được truyền (partial update) |
| `POST /api/users/me/change-password` | 200 / 400 ✅ | Thu hồi RefreshToken sau đổi mật khẩu |
| `GET /api/users` | 200 ✅ | Chỉ Admin, có phân trang + tìm kiếm |
| `PUT /api/users/{id}/status` | 200 / 400 / 404 ✅ | Admin không tự khóa mình |

### 5.2. Kiểm tra bảo mật ✅

- ✅ **Không hard-code secret** — `Jwt:Secret` đọc từ `appsettings.json` / `dotnet user-secrets`. `Program.cs` throw nếu key rỗng hoặc < 32 ký tự.
- ✅ **Validate input** — `RegisterDto` dùng `[Required]`, `[StringLength]`, `[RegularExpression]` cho Username/Password/Phone. ModelState binding tự động trả 400 theo cấu trúc `ApiResponse`.
- ✅ **ORM (EF Core)** — toàn bộ query dùng LINQ, không có raw SQL, không có SQL Injection.
- ✅ **Authorization** — `UserController` dùng `[Authorize]` + `[Authorize(Roles = "Admin")]`. Endpoint admin kiểm tra role qua JWT claim.
- ✅ **Không lộ thông tin nhạy cảm** — `ExceptionMiddleware` bắt toàn bộ exception, chỉ trả `message` ngắn gọn, không stack trace. `PasswordHash` có `[JsonIgnore]`.
- ✅ **Thông báo chung khi login/forgot-password** — không lộ tài khoản nào tồn tại.
- ⚠️ **Should fix** — `RefreshToken.Token` đang lưu raw token 64 byte. Nên lưu SHA-256 hash để bảo vệ nếu DB bị lộ (client giữ bản gốc). Xem comment trong `RefreshToken.cs` dòng 22.
- ⚠️ **Should fix** — `appsettings.json` commit kèm `Seed:AdminPassword = "Admin@123456"`. Nên chuyển sang `dotnet user-secrets` hoặc đặt giá trị placeholder rõ ràng hơn.

### 5.3. Kiểm tra hiệu năng & chất lượng ✅

- ✅ **Không có N+1 query** — `RefreshTokenAsync` dùng `.Include(r => r.User)` một lần, không lazy load.
- ✅ **Index** — `UserConfiguration` và `RefreshTokenConfiguration` cần kiểm tra đã có index cho `Email`, `Username`, `Token`. Xem `Data/Configurations/`.
- ✅ **Độ dài method** — `AuthService` method dài nhất là `RegisterAsync` (~37 dòng), `LoginAsync` (~37 dòng). Trong ngưỡng cho phép.
- ✅ **Tên rõ nghĩa** — PascalCase cho class/method, camelCase cho local variable, `_` prefix cho private field.
- ✅ **Comment đúng chỗ** — có XML doc cho class và property phức tạp, không comment thừa.
- ✅ **Không có dead code** — không có `Console.WriteLine`, không có code comment-out.
- ✅ **`ExecuteUpdateAsync`** — dùng đúng cho `LastLoginAt` để tránh làm bẩn `UpdatedAt` (pattern đặc biệt, đã comment rõ).

### 5.4. Kiểm tra cấu trúc ✅

- ✅ **Tách tầng** — `Controller → IService → Service → AppDbContext`. Không có business logic trong Controller.
- ✅ **Error handling thống nhất** — `AppException` + `ExceptionMiddleware` bắt tập trung, trả cấu trúc `ApiResponse` camelCase đồng nhất.
- ✅ **Logging** — `ExceptionMiddleware` log `Warning` cho `AppException`, `Error` cho unhandled. `EmailService` log `Information`. Không log mật khẩu.
- ✅ **Soft delete** — `AuditableEntity` + `AppDbContext.ApplyAuditInfo()` tự động chuyển `Deleted` → `Modified` với `DeletedAt`.
- ✅ **Audit tự động** — `CreatedAt/By`, `UpdatedAt/By`, `DeletedAt/By` ghi tự động, service không gán tay.

### 5.5. Điểm cần cải thiện (tổng hợp)

| Mức độ | Vấn đề | Vị trí |
|---|---|---|
| **Should fix** | Lưu SHA-256 hash của RefreshToken thay vì raw token | `Models/RefreshToken.cs`, `Services/AuthService.cs` |
| **Should fix** | `Seed:AdminPassword` trong `appsettings.json` nên là placeholder | `appsettings.json` dòng 19 |
| **Nice to have** | Thêm rate limiting cho `/api/auth/login` và `/api/auth/forgot-password` | `Program.cs` |
| **Nice to have** | Thêm unit test cho `AuthService` và `UserService` | Tạo project `backend.Tests/` |
| **Nice to have** | `EmailService` hiện chỉ log — nên tích hợp SMTP/SendGrid khi deploy thật | `Services/EmailService.cs` |
| **Nice to have** | `GetAllAsync` trong `UserService` chưa trả tổng số bản ghi (totalCount) cho frontend phân trang | `Services/UserService.cs` |

---

## 6. Cây cấu trúc dự án hiện tại

> Cập nhật: 23/09/2026

```
online-auction-system/
├── .gitignore
├── GITHUB-WORKFLOW-RULES.md
├── OnlineAuctionSystem.slnx
├── TAI-LIEU-KY-THUAT-BACKEND.md
├── THIET-KE-BANG-MODULE-HOANG.md
│
├── backend/                              ← ASP.NET Core Web API (.NET 10)
│   ├── backend.csproj                    ← Cấu hình project + NuGet packages
│   ├── backend.http                      ← File test API nhanh (VS Code REST Client)
│   ├── backend.md                        ← Tài liệu review & cây cấu trúc (file này)
│   ├── Program.cs                        ← Entry point: DI, middleware pipeline, seed Admin
│   ├── appsettings.json                  ← Cấu hình: ConnectionStrings, Jwt, App, Seed
│   ├── appsettings.Development.json      ← Override cấu hình môi trường Development
│   │
│   ├── Controllers/                      ← Tầng Controller (HTTP → Service)
│   │   ├── AuthController.cs             ← POST register/login/refresh-token/logout/verify-email/forgot-password/reset-password
│   │   └── UserController.cs             ← GET+PUT /me, POST /me/change-password, GET+PUT /admin
│   │
│   ├── Data/                             ← Tầng dữ liệu (EF Core)
│   │   ├── AppDbContext.cs               ← DbContext chính: DbSets, audit tự động, soft delete
│   │   └── Configurations/               ← Fluent API configuration cho từng entity
│   │       ├── UserConfiguration.cs      ← Index Email/Username, check constraint Role
│   │       ├── RefreshTokenConfiguration.cs  ← Index Token, quan hệ User → RefreshTokens
│   │       └── UserVerificationTokenConfiguration.cs  ← Index Token+Type
│   │
│   ├── DTOs/                             ← Data Transfer Objects (request & response)
│   │   ├── Common/
│   │   │   └── ApiResponse.cs            ← Wrapper phản hồi chuẩn: { success, message, data, errors }
│   │   ├── Auth/
│   │   │   ├── AuthResponseDto.cs        ← { accessToken, refreshToken, accessTokenExpiresAt, user }
│   │   │   ├── LoginDto.cs               ← { usernameOrEmail, password }
│   │   │   ├── RegisterDto.cs            ← { username, email, password, fullName, phone?, address? }
│   │   │   ├── RefreshTokenDto.cs        ← { refreshToken }
│   │   │   ├── ForgotPasswordDto.cs      ← { email }
│   │   │   ├── ResetPasswordDto.cs       ← { token, newPassword }
│   │   │   └── VerifyEmailDto.cs         ← { token }
│   │   └── User/
│   │       ├── UserProfileDto.cs         ← Response profile đầy đủ (không có PasswordHash)
│   │       ├── UpdateProfileDto.cs       ← { fullName?, phone?, address?, avatarUrl? }
│   │       ├── ChangePasswordDto.cs      ← { currentPassword, newPassword }
│   │       └── UpdateUserStatusDto.cs    ← { isActive }
│   │
│   ├── Helpers/                          ← Tiện ích dùng chung
│   │   ├── JwtHelper.cs                  ← Sinh access token JWT (HS256, claim: sub/name/email/role)
│   │   ├── PasswordHelper.cs             ← Bọc BCrypt.HashPassword / Verify
│   │   └── TokenGeneratorHelper.cs       ← RandomNumberGenerator → Base64Url (64 byte refresh, 32 byte verify)
│   │
│   ├── Hubs/                             ← SignalR Hubs (Module 3 – chưa implement)
│   │
│   ├── Middlewares/
│   │   └── ExceptionMiddleware.cs        ← Bắt AppException + unhandled → trả ApiResponse camelCase, không lộ stack trace
│   │
│   ├── Migrations/                       ← EF Core migrations
│   │   ├── 20260921144146_AddAuthTables.cs       ← Migration đầu: bảng Users, RefreshTokens, UserVerificationTokens
│   │   ├── 20260921144146_AddAuthTables.Designer.cs
│   │   └── AppDbContextModelSnapshot.cs
│   │
│   ├── Models/                           ← Domain models (ánh xạ DB)
│   │   ├── AuditableEntity.cs            ← Base class: CreatedAt/By, UpdatedAt/By, DeletedAt/By
│   │   ├── User.cs                       ← Người dùng: Id, Username, Email, PasswordHash, Role, IsActive, IsEmailVerified, LockoutEnd...
│   │   ├── RefreshToken.cs               ← Token làm mới phiên: Token, ExpiresAt, IsRevoked, ReplacedByTokenId
│   │   ├── UserVerificationToken.cs      ← Token xác thực email / reset mật khẩu: Token, Type, ExpiresAt, IsUsed
│   │   ├── Roles.cs                      ← Hằng số: "User" / "Seller" / "Admin"
│   │   └── VerificationTokenType.cs      ← Hằng số: "EmailVerify" / "PasswordReset"
│   │
│   ├── Properties/
│   │   └── launchSettings.json           ← Cấu hình chạy dev (port, env vars)
│   │
│   ├── Repositories/                     ← (Chưa dùng – Module 2 & 3 sẽ thêm nếu cần)
│   │
│   └── Services/                         ← Tầng nghiệp vụ (Business Logic)
│       ├── IAuthService.cs               ← Interface: Register/Login/RefreshToken/Logout/VerifyEmail/ForgotPassword/ResetPassword
│       ├── AuthService.cs                ← Implement: xác thực, lockout 5 lần sai, xoay vòng token
│       ├── IUserService.cs               ← Interface: GetMe/UpdateMe/ChangePassword/GetAll/UpdateStatus
│       ├── UserService.cs                ← Implement: quản lý hồ sơ, phân trang, khóa tài khoản
│       ├── IEmailService.cs (trong EmailService.cs)  ← Interface gửi email
│       └── EmailService.cs               ← Implement mock: log link xác thực / đặt lại mật khẩu
│
└── frontend/                             ← React + Vite
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── eslint.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── assets/                       ← hero.png, react.svg, vite.svg
        ├── components/
        │   ├── Layout.jsx
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   └── ui.jsx                    ← Component UI dùng chung
        ├── context/
        │   └── AuthContext.jsx           ← Context lưu trạng thái đăng nhập
        ├── hooks/                        ← Custom hooks (chưa có file)
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── VerifyEmail.jsx
        │   ├── ForgotPassword.jsx
        │   ├── ResetPassword.jsx
        │   ├── Profile.jsx
        │   ├── ChangePassword.jsx
        │   └── AdminUsers.jsx
        ├── routes/
        │   ├── index.jsx                 ← Định nghĩa route toàn app
        │   └── ProtectedRoute.jsx        ← HOC bảo vệ route cần đăng nhập / role
        ├── services/
        │   ├── api.js                    ← Axios instance + interceptor tự động refresh token
        │   ├── authService.js            ← Gọi API auth (register/login/logout...)
        │   └── userService.js            ← Gọi API user (getMe/updateMe/changePassword...)
        ├── store/                        ← State management (chưa có file)
        └── utils/                        ← Hàm tiện ích (chưa có file)
```

---

## 7. Luồng dữ liệu chính (Module 1)

```
Client
  │
  ▼
[AuthController / UserController]   ← validate ModelState (DataAnnotations)
  │
  ▼
[IAuthService / IUserService]       ← business logic, throw AppException khi lỗi
  │
  ├── [JwtHelper]                   ← sinh access token JWT
  ├── [PasswordHelper]              ← BCrypt hash/verify
  ├── [TokenGeneratorHelper]        ← sinh refresh/verify token an toàn
  ├── [IEmailService]               ← gửi email (mock: chỉ log)
  │
  ▼
[AppDbContext]                      ← EF Core, audit tự động, soft delete
  │
  ▼
SQL Server (online-auction-system-db)
  │  Tables: Users, RefreshTokens, UserVerificationTokens
  │
  ▼ (lỗi bất kỳ tầng nào)
[ExceptionMiddleware]               ← chuẩn hóa response lỗi → ApiResponse camelCase
```

---

> **Quy ước nhóm:** Mỗi lần file `backend.md` được yêu cầu review → cập nhật lại cây cấu trúc mục 6 phản ánh trạng thái dự án hiện tại.
