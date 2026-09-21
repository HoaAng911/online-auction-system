# TÀI LIỆU KỸ THUẬT BACKEND
## Hệ thống Đấu giá sản phẩm trực tuyến

**Nhóm thực hiện:** Hoàng — Long — Hằng
**Công nghệ:** ASP.NET Core Web API (.NET 8), Entity Framework Core, SQL Server, SignalR, JWT
**Thời gian:** 4 tuần

---

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Thiết kế cơ sở dữ liệu](#2-thiết-kế-cơ-sở-dữ-liệu)
3. [Quy ước chung](#3-quy-ước-chung)
4. [Phân công công việc](#4-phân-công-công-việc)
5. [Module 1 — Hoàng: Xác thực & Người dùng](#5-module-1--hoàng-xác-thực--người-dùng)
6. [Module 2 — Long: Sản phẩm & Đấu giá](#6-module-2--long-sản-phẩm--đấu-giá)
7. [Module 3 — Hằng: Thanh toán, Thông báo & Đánh giá](#7-module-3--hằng-thanh-toán-thông-báo--đánh-giá)
8. [Điểm phối hợp giữa các module](#8-điểm-phối-hợp-giữa-các-module)
9. [Kế hoạch triển khai](#9-kế-hoạch-triển-khai)
10. [Tiêu chí hoàn thành](#10-tiêu-chí-hoàn-thành)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Kiến trúc

```
Client (React + Vite)
        │  HTTP/REST + WebSocket (SignalR)
        ▼
Backend API (ASP.NET Core)
  ├── Controllers   → tiếp nhận request
  ├── Services      → xử lý nghiệp vụ
  ├── Repositories   → truy vấn dữ liệu
  ├── Hubs           → real-time (SignalR)
  └── Data (EF Core) → ánh xạ đối tượng - quan hệ
        │
        ▼
   SQL Server Database
```

### 1.2 Luồng nghiệp vụ chính

```
Người bán đăng sản phẩm (Pending)
        ↓
Quản trị viên duyệt (Active)
        ↓
Người mua xem và đặt giá — cập nhật real-time cho mọi người xem
        ↓
Hết thời gian → hệ thống tự động đóng phiên (Ended)
        ↓
Xác định người thắng → tạo giao dịch thanh toán → gửi thông báo
        ↓
Người thắng thanh toán và đánh giá
```

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU

### 2.1 Danh sách bảng

| STT | Bảng | Mô tả |
|---|---|---|
| 1 | Users | Người dùng và phân quyền |
| 2 | RefreshTokens | Token làm mới phiên đăng nhập |
| 3 | UserVerificationTokens | Xác thực email và đặt lại mật khẩu |
| 4 | Categories | Danh mục sản phẩm |
| 5 | Products | Sản phẩm đấu giá |
| 6 | ProductImages | Thư viện ảnh sản phẩm |
| 7 | Bids | Lịch sử đặt giá |
| 8 | AuctionWinners | Người thắng đấu giá |
| 9 | Payments | Giao dịch thanh toán |
| 10 | Notifications | Thông báo hệ thống |
| 11 | WatchLists | Sản phẩm theo dõi |
| 12 | Reviews | Đánh giá sau giao dịch |
| 13 | ReportedProducts | Báo cáo vi phạm |
| 14 | Settings | Cấu hình hệ thống |

### 2.2 Sơ đồ quan hệ

```
Users (1) ──────< (N) Products [Seller]
Users (1) ──────< (N) Bids [Bidder]
Users (1) ──────< (N) RefreshTokens
Users (1) ──────< (N) UserVerificationTokens
Users (1) ──────< (N) Notifications
Users (1) ──────< (N) WatchLists
Users (1) ──────< (N) Reviews [Reviewer]
Users (1) ──────< (N) ReportedProducts [Reporter]

Categories (1) ──< (N) Products

Products (1) ────< (N) ProductImages
Products (1) ────< (N) Bids
Products (1) ────< (N) WatchLists
Products (1) ────< (N) Reviews
Products (1) ────< (N) ReportedProducts
Products (1) ──── (1) AuctionWinners

Bids (1) ───────── (1) AuctionWinners [WinningBid]
AuctionWinners (1)  (1) Payments
```

### 2.3 Chi tiết các bảng

#### Users

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| Username | NVARCHAR(50) | NOT NULL, UNIQUE |
| Email | NVARCHAR(100) | NOT NULL, UNIQUE |
| PasswordHash | NVARCHAR(255) | NOT NULL |
| FullName | NVARCHAR(100) | NOT NULL |
| Phone | NVARCHAR(20) | NULL |
| Address | NVARCHAR(255) | NULL |
| AvatarUrl | NVARCHAR(500) | NULL |
| Role | NVARCHAR(20) | NOT NULL, DEFAULT 'User' — User / Seller / Admin |
| IsActive | BIT | NOT NULL, DEFAULT 1 |
| IsEmailVerified | BIT | NOT NULL, DEFAULT 0 |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |
| UpdatedAt | DATETIME2 | NULL |

#### RefreshTokens

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| UserId | INT | FK → Users(Id), NOT NULL |
| Token | NVARCHAR(500) | NOT NULL, UNIQUE |
| ExpiresAt | DATETIME2 | NOT NULL |
| IsRevoked | BIT | NOT NULL, DEFAULT 0 |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |

#### UserVerificationTokens

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| UserId | INT | FK → Users(Id), NOT NULL |
| Token | NVARCHAR(255) | NOT NULL, UNIQUE |
| Type | NVARCHAR(20) | NOT NULL — `EmailVerify` hoặc `PasswordReset` |
| ExpiresAt | DATETIME2 | NOT NULL |
| IsUsed | BIT | NOT NULL, DEFAULT 0 |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |

#### Categories

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| Name | NVARCHAR(100) | NOT NULL, UNIQUE |
| Description | NVARCHAR(255) | NULL |
| IconUrl | NVARCHAR(500) | NULL |
| DisplayOrder | INT | NOT NULL, DEFAULT 0 |
| IsActive | BIT | NOT NULL, DEFAULT 1 |

#### Products

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| SellerId | INT | FK → Users(Id), NOT NULL |
| CategoryId | INT | FK → Categories(Id), NOT NULL |
| Title | NVARCHAR(200) | NOT NULL |
| Description | NVARCHAR(MAX) | NULL |
| ImageUrl | NVARCHAR(500) | NULL |
| StartPrice | DECIMAL(18,2) | NOT NULL |
| CurrentPrice | DECIMAL(18,2) | NOT NULL |
| StepPrice | DECIMAL(18,2) | NOT NULL, DEFAULT 10000 |
| BuyNowPrice | DECIMAL(18,2) | NULL |
| StartTime | DATETIME2 | NOT NULL |
| EndTime | DATETIME2 | NOT NULL |
| Status | NVARCHAR(20) | NOT NULL, DEFAULT 'Pending' — Pending / Active / Ended / Cancelled |
| ViewCount | INT | NOT NULL, DEFAULT 0 |
| BidCount | INT | NOT NULL, DEFAULT 0 |
| IsDeleted | BIT | NOT NULL, DEFAULT 0 |
| RowVersion | ROWVERSION | dùng cho kiểm soát tương tranh khi đặt giá |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |
| ApprovedBy | INT | FK → Users(Id), NULL |
| ApprovedAt | DATETIME2 | NULL |

#### ProductImages

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| ProductId | INT | FK → Products(Id), NOT NULL |
| ImageUrl | NVARCHAR(500) | NOT NULL |
| DisplayOrder | INT | NOT NULL, DEFAULT 0 |

#### Bids

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| ProductId | INT | FK → Products(Id), NOT NULL |
| BidderId | INT | FK → Users(Id), NOT NULL |
| BidAmount | DECIMAL(18,2) | NOT NULL |
| BidTime | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |

#### AuctionWinners

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| ProductId | INT | FK → Products(Id), NOT NULL, UNIQUE |
| WinnerId | INT | FK → Users(Id), NOT NULL |
| WinningBidId | INT | FK → Bids(Id), NOT NULL |
| WinningPrice | DECIMAL(18,2) | NOT NULL |
| WonAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |
| Status | NVARCHAR(20) | NOT NULL, DEFAULT 'Pending' — Pending / Paid / Completed / Cancelled |

#### Payments

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| AuctionWinnerId | INT | FK → AuctionWinners(Id), NOT NULL, UNIQUE |
| PaymentMethod | NVARCHAR(50) | NOT NULL — VNPay / Momo / COD / BankTransfer |
| Amount | DECIMAL(18,2) | NOT NULL |
| TransactionId | NVARCHAR(100) | NULL, UNIQUE |
| Status | NVARCHAR(20) | NOT NULL, DEFAULT 'Pending' — Pending / Success / Failed |
| PaidAt | DATETIME2 | NULL |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |

#### Notifications

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| UserId | INT | FK → Users(Id), NOT NULL |
| Title | NVARCHAR(200) | NOT NULL |
| Message | NVARCHAR(MAX) | NOT NULL |
| Type | NVARCHAR(20) | NOT NULL — OutBid / Won / ProductApproved / ProductRejected |
| RelatedEntityType | NVARCHAR(50) | NULL |
| RelatedEntityId | INT | NULL |
| IsRead | BIT | NOT NULL, DEFAULT 0 |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |

#### WatchLists

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| UserId | INT | FK → Users(Id), NOT NULL |
| ProductId | INT | FK → Products(Id), NOT NULL |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |

#### Reviews

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| ProductId | INT | FK → Products(Id), NOT NULL |
| ReviewerId | INT | FK → Users(Id), NOT NULL |
| Rating | INT | NOT NULL, 1–5 |
| Comment | NVARCHAR(MAX) | NULL |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |

#### ReportedProducts

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| ProductId | INT | FK → Products(Id), NOT NULL |
| ReporterId | INT | FK → Users(Id), NOT NULL |
| Reason | NVARCHAR(MAX) | NOT NULL |
| Status | NVARCHAR(20) | NOT NULL, DEFAULT 'Pending' — Pending / Resolved / Rejected |
| ResolvedBy | INT | FK → Users(Id), NULL |
| ResolvedAt | DATETIME2 | NULL |
| CreatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |

#### Settings

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| Id | INT | PK, IDENTITY |
| Key | NVARCHAR(100) | NOT NULL, UNIQUE |
| Value | NVARCHAR(MAX) | NOT NULL |
| Description | NVARCHAR(255) | NULL |
| UpdatedAt | DATETIME2 | NOT NULL, DEFAULT GETUTCDATE() |

### 2.4 Ràng buộc

**Unique:**
```sql
ALTER TABLE WatchLists ADD CONSTRAINT UQ_WatchLists_UserProduct UNIQUE (UserId, ProductId);
ALTER TABLE Reviews ADD CONSTRAINT UQ_Reviews_ProductReviewer UNIQUE (ProductId, ReviewerId);
```

**Check:**
```sql
ALTER TABLE Products ADD CONSTRAINT CK_Products_EndTime CHECK (EndTime > StartTime);
ALTER TABLE Products ADD CONSTRAINT CK_Products_CurrentPrice CHECK (CurrentPrice >= StartPrice);
ALTER TABLE Bids ADD CONSTRAINT CK_Bids_Amount CHECK (BidAmount > 0);
ALTER TABLE Reviews ADD CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5);
ALTER TABLE Payments ADD CONSTRAINT CK_Payments_Amount CHECK (Amount > 0);
```

**Foreign Key — hành động xóa:**

| Bảng con | Cột | Bảng cha | ON DELETE |
|---|---|---|---|
| Products | SellerId | Users | NO ACTION |
| ProductImages | ProductId | Products | CASCADE |
| Bids | ProductId | Products | NO ACTION |
| AuctionWinners | ProductId | Products | NO ACTION |
| Payments | AuctionWinnerId | AuctionWinners | NO ACTION |
| Notifications | UserId | Users | CASCADE |
| WatchLists | UserId, ProductId | Users, Products | CASCADE |
| Reviews | ProductId | Products | NO ACTION |
| RefreshTokens | UserId | Users | CASCADE |
| UserVerificationTokens | UserId | Users | CASCADE |

### 2.5 Index

```sql
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Products_CategoryId ON Products(CategoryId);
CREATE INDEX IX_Products_SellerId ON Products(SellerId);
CREATE INDEX IX_Products_Status_EndTime ON Products(Status, EndTime) WHERE IsDeleted = 0;
CREATE INDEX IX_Bids_ProductId_Amount ON Bids(ProductId, BidAmount DESC);
CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(UserId, IsRead);
CREATE INDEX IX_RefreshTokens_Token ON RefreshTokens(Token) WHERE IsRevoked = 0;
```

---

## 3. QUY ƯỚC CHUNG

### 3.1 Định dạng phản hồi API

Mọi endpoint trả về đúng cấu trúc sau:

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
}
```

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": { "token": "eyJhbGciOi...", "user": { "id": 1, "role": "User" } },
  "errors": null
}
```

### 3.2 Mã trạng thái HTTP

| Mã | Trường hợp sử dụng |
|---|---|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Dữ liệu đầu vào không hợp lệ |
| 401 | Chưa xác thực hoặc token hết hạn |
| 403 | Không đủ quyền truy cập |
| 404 | Không tìm thấy tài nguyên |
| 409 | Xung đột dữ liệu (ví dụ: đặt giá không còn hợp lệ) |
| 500 | Lỗi hệ thống |

### 3.3 Quy ước đặt tên

| Đối tượng | Chuẩn | Ví dụ |
|---|---|---|
| Class, phương thức C# | PascalCase | `ProductService`, `GetById()` |
| Biến, tham số C# | camelCase | `productId`, `currentPrice` |
| Thuộc tính JSON | camelCase | `{ "productId": 1 }` |
| Route API | kebab-case, số nhiều | `/api/products`, `/api/bid-automations` |
| Bảng CSDL | PascalCase, số nhiều | `Products`, `Bids` |
| Nhánh Git | `feature/<module>-<mô-tả>` | `feature/auth-login` |
| Migration | PascalCase mô tả thay đổi | `AddProductTable` |

### 3.4 Cấu hình serialize JSON camelCase

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);
```

---

## 4. PHÂN CÔNG CÔNG VIỆC

| Người phụ trách | Module | Bảng dữ liệu |
|---|---|---|
| **Hoàng** | Xác thực & Người dùng | Users, RefreshTokens, UserVerificationTokens |
| **Long** | Sản phẩm & Đấu giá | Categories, Products, ProductImages, Bids, AuctionWinners, WatchLists, ReportedProducts |
| **Hằng** | Thanh toán, Thông báo & Đánh giá | Payments, Notifications, Reviews, Settings |

**Cơ sở phân chia**: Module của Hoàng là nền tảng xác thực bắt buộc phải hoàn thiện sớm để hai module còn lại hoạt động. Module của Long có độ phức tạp kỹ thuật cao nhất do xử lý real-time và kiểm soát tương tranh khi nhiều người đặt giá đồng thời. Module của Hằng gồm các nghiệp vụ độc lập, ít phụ thuộc lẫn nhau, phù hợp triển khai song song.

---

## 5. MODULE 1 — HOÀNG: XÁC THỰC & NGƯỜI DÙNG

### 5.1 Cấu trúc file

```
backend/
├── Models/
│   ├── User.cs
│   ├── RefreshToken.cs
│   └── UserVerificationToken.cs
├── DTOs/Auth/
│   ├── RegisterDto.cs
│   ├── LoginDto.cs
│   ├── AuthResponseDto.cs
│   ├── RefreshTokenDto.cs
│   ├── VerifyEmailDto.cs
│   ├── ForgotPasswordDto.cs
│   └── ResetPasswordDto.cs
├── DTOs/User/
│   ├── UserProfileDto.cs
│   └── UpdateProfileDto.cs
├── Services/
│   ├── IAuthService.cs / AuthService.cs
│   ├── IUserService.cs / UserService.cs
│   └── EmailService.cs
├── Controllers/
│   ├── AuthController.cs
│   └── UserController.cs
├── Helpers/
│   ├── JwtHelper.cs
│   ├── PasswordHelper.cs
│   └── TokenGeneratorHelper.cs
└── Middlewares/
    └── ExceptionMiddleware.cs
```

### 5.2 API

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/auth/register` | Công khai | Đăng ký tài khoản, gửi email xác thực |
| POST | `/api/auth/login` | Công khai | Đăng nhập, trả về access token và refresh token |
| POST | `/api/auth/refresh-token` | Công khai | Làm mới access token |
| POST | `/api/auth/logout` | Đã xác thực | Thu hồi refresh token |
| POST | `/api/auth/verify-email` | Công khai | Xác thực email bằng token |
| POST | `/api/auth/forgot-password` | Công khai | Gửi email đặt lại mật khẩu |
| POST | `/api/auth/reset-password` | Công khai | Đặt lại mật khẩu bằng token |
| GET | `/api/users/me` | Đã xác thực | Xem hồ sơ cá nhân |
| PUT | `/api/users/me` | Đã xác thực | Cập nhật hồ sơ |
| GET | `/api/users` | Quản trị viên | Danh sách người dùng |
| PUT | `/api/users/{id}/status` | Quản trị viên | Khóa hoặc mở khóa tài khoản |

### 5.3 Model `UserVerificationToken`

```csharp
public class UserVerificationToken
{
    public int Id { get; set; }
    public int UserId { get; set; }

    [Required, MaxLength(255)]
    public string Token { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Type { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public static class VerificationTokenType
{
    public const string EmailVerify = "EmailVerify";
    public const string PasswordReset = "PasswordReset";
}
```

Thời hạn token thiết lập theo `Type` trong tầng Service: `EmailVerify` — 24 giờ, `PasswordReset` — 1 giờ. Mọi truy vấn token bắt buộc kèm điều kiện `Type` để tránh sử dụng sai mục đích.

### 5.4 JwtHelper

```csharp
public class JwtHelper
{
    private readonly IConfiguration _config;
    public JwtHelper(IConfiguration config) => _config = config;

    public string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

### 5.5 Việc cần hoàn thành

- Thiết lập `AppDbContext` ban đầu, bàn giao cho Long và Hằng bổ sung `DbSet` tương ứng
- Cấu hình JWT Authentication và Authorization trong `Program.cs`
- Triển khai đầy đủ bảy luồng xác thực nêu tại mục 5.2
- Cơ chế xoay vòng refresh token: mỗi lần làm mới, thu hồi token cũ và phát hành token mới
- `EmailService` mô phỏng gửi email bằng cách ghi log, không tích hợp SMTP thật
- `ExceptionMiddleware` xử lý lỗi tập trung, áp dụng cho toàn bộ dự án
- Khởi tạo một tài khoản Quản trị viên mặc định khi seed dữ liệu
- Không trả về `PasswordHash` trong bất kỳ phản hồi nào

---

## 6. MODULE 2 — LONG: SẢN PHẨM & ĐẤU GIÁ

### 6.1 Cấu trúc file

```
backend/
├── Models/
│   ├── Category.cs
│   ├── Product.cs
│   ├── ProductImage.cs
│   ├── Bid.cs
│   ├── AuctionWinner.cs
│   ├── WatchList.cs
│   └── ReportedProduct.cs
├── DTOs/Product/...
├── DTOs/Bid/...
├── Services/
│   ├── ProductService.cs
│   ├── CategoryService.cs
│   ├── BidService.cs
│   ├── WatchListService.cs
│   ├── AuctionCloseService.cs
│   └── FileUploadService.cs
├── Repositories/
│   ├── IProductRepository.cs
│   └── ProductRepository.cs
├── Controllers/
│   ├── ProductController.cs
│   ├── CategoryController.cs
│   ├── BidController.cs
│   ├── WatchListController.cs
│   └── ReportController.cs
└── Hubs/
    └── AuctionHub.cs
```

### 6.2 API

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/products` | Công khai | Danh sách sản phẩm, hỗ trợ lọc và phân trang |
| GET | `/api/products/{id}` | Công khai | Chi tiết sản phẩm |
| GET | `/api/products/my` | Người bán | Sản phẩm của người dùng hiện tại |
| POST | `/api/products` | Người bán | Đăng sản phẩm mới |
| PUT | `/api/products/{id}` | Người bán | Chỉnh sửa khi sản phẩm còn ở trạng thái chờ duyệt |
| DELETE | `/api/products/{id}` | Người bán / Quản trị viên | Xóa mềm sản phẩm |
| PUT | `/api/products/{id}/approve` | Quản trị viên | Duyệt sản phẩm |
| PUT | `/api/products/{id}/reject` | Quản trị viên | Từ chối sản phẩm |
| POST | `/api/products/upload-image` | Người bán | Tải ảnh sản phẩm |
| GET / POST / PUT / DELETE | `/api/categories` | Công khai / Quản trị viên | Quản lý danh mục |
| POST | `/api/bids` | Đã xác thực | Đặt giá |
| GET | `/api/bids/product/{id}` | Công khai | Lịch sử đặt giá của sản phẩm |
| GET | `/api/bids/my-bids` | Đã xác thực | Lịch sử đặt giá của bản thân |
| POST / DELETE | `/api/watchlists/{productId}` | Đã xác thực | Theo dõi hoặc bỏ theo dõi sản phẩm |
| GET | `/api/watchlists` | Đã xác thực | Danh sách sản phẩm đang theo dõi |
| POST | `/api/reports` | Đã xác thực | Báo cáo sản phẩm vi phạm |
| GET / PUT | `/api/reports` | Quản trị viên | Xử lý báo cáo |

### 6.3 Xử lý đặt giá — kiểm soát tương tranh

```csharp
public async Task<BidResponseDto> PlaceBidAsync(int userId, BidCreateDto dto)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null) throw new AppException("Sản phẩm không tồn tại", 404);
        if (product.Status != "Active") throw new AppException("Sản phẩm không trong trạng thái đấu giá", 400);

        var now = DateTime.UtcNow;
        if (now < product.StartTime || now > product.EndTime)
            throw new AppException("Ngoài thời gian đấu giá", 400);
        if (product.SellerId == userId)
            throw new AppException("Không thể tự đặt giá sản phẩm của mình", 400);

        var bidder = await _context.Users.FindAsync(userId);
        if (bidder == null || !bidder.IsActive)
            throw new AppException("Tài khoản của bạn đã bị khóa hoặc không tồn tại", 403);

        decimal minValidAmount = product.CurrentPrice + product.StepPrice;
        if (dto.Amount < minValidAmount)
            throw new AppException($"Giá đặt phải lớn hơn hoặc bằng {minValidAmount}", 409);

        product.CurrentPrice = dto.Amount;
        product.BidCount += 1;

        var bid = new Bid { ProductId = dto.ProductId, BidderId = userId, BidAmount = dto.Amount, BidTime = now };
        _context.Bids.Add(bid);

        if ((product.EndTime - now).TotalMinutes <= 2)
            product.EndTime = product.EndTime.AddMinutes(2);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return new BidResponseDto { /* ánh xạ dữ liệu trả về */ };
    }
    catch (DbUpdateConcurrencyException)
    {
        await transaction.RollbackAsync();
        throw new AppException("Có người khác vừa đặt giá, vui lòng thử lại", 409);
    }
}
```

Cột `RowVersion` trên bảng `Products` cho phép Entity Framework Core phát hiện xung đột khi hai người đặt giá cùng lúc: người xử lý sau nhận `DbUpdateConcurrencyException` và phải thử lại.

### 6.4 SignalR — hợp đồng sự kiện

| Sự kiện | Hướng | Đích nhận | Payload | Thời điểm phát sinh |
|---|---|---|---|---|
| `JoinProductGroup` | Client → Server | — | `productId` | Client vào trang chi tiết sản phẩm |
| `LeaveProductGroup` | Client → Server | — | `productId` | Client rời trang chi tiết sản phẩm |
| `PriceUpdated` | Server → Client | Nhóm `product-{id}` | `{ productId, newPrice, bidderName, bidTime }` | Sau khi một lượt đặt giá lưu thành công |
| `OutBid` | Server → Client | Người dùng bị vượt giá | `{ productId, newPrice, message }` | Có người đặt giá cao hơn |
| `AuctionEnded` | Server → Client | Nhóm `product-{id}` | `{ productId, status, winnerId? }` | Phiên đấu giá kết thúc |
| `TimeExtended` | Server → Client | Nhóm `product-{id}` | `{ productId, newEndTime }` | Gia hạn tự động do đặt giá phút cuối |

```csharp
public class AuctionHub : Hub
{
    public async Task JoinProductGroup(int productId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"product-{productId}");

    public async Task LeaveProductGroup(int productId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"product-{productId}");
}
```

Để gửi sự kiện `OutBid` đến đúng người dùng, cần đăng ký `IUserIdProvider` ánh xạ `ConnectionId` theo claim JWT:

```csharp
public class NameIdentifierUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
        => connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
```

### 6.5 Đóng phiên đấu giá tự động

```csharp
public class AuctionCloseService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    public AuctionCloseService(IServiceProvider serviceProvider) => _serviceProvider = serviceProvider;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<AuctionHub>>();

            var expiredProducts = await context.Products
                .Where(p => p.Status == "Active" && p.EndTime <= DateTime.UtcNow)
                .ToListAsync(stoppingToken);

            foreach (var product in expiredProducts)
            {
                var winningBid = await context.Bids
                    .Where(b => b.ProductId == product.Id)
                    .OrderByDescending(b => b.BidAmount)
                    .FirstOrDefaultAsync(stoppingToken);

                product.Status = winningBid != null ? "Ended" : "Cancelled";

                if (winningBid != null)
                {
                    context.AuctionWinners.Add(new AuctionWinner
                    {
                        ProductId = product.Id,
                        WinnerId = winningBid.BidderId,
                        WinningBidId = winningBid.Id,
                        WinningPrice = winningBid.BidAmount,
                        Status = "Pending"
                    });
                }

                await hubContext.Clients.Group($"product-{product.Id}")
                    .SendAsync("AuctionEnded", new { productId = product.Id, status = product.Status }, stoppingToken);
            }

            await context.SaveChangesAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
```

Sau khi tạo `AuctionWinner`, module của Hằng chịu trách nhiệm gửi thông báo và khởi tạo giao dịch thanh toán tương ứng — xem mục 8.

### 6.6 Việc cần hoàn thành

- Bảy Model tương ứng bảy bảng phụ trách, cấu hình Fluent API cho khóa ngoại
- `ProductRepository`: lọc, tìm kiếm, phân trang, chỉ truy vấn bản ghi chưa xóa mềm
- `BidService.PlaceBidAsync` theo đúng logic tại mục 6.3
- `AuctionHub` cùng `IUserIdProvider`
- `AuctionCloseService` chạy nền, quét định kỳ 30 giây
- `WatchListService`, xử lý báo cáo vi phạm sản phẩm
- Kiểm thử tình huống hai người đặt giá đồng thời trên cùng sản phẩm

---

## 7. MODULE 3 — HẰNG: THANH TOÁN, THÔNG BÁO & ĐÁNH GIÁ

### 7.1 Cấu trúc file

```
backend/
├── Models/
│   ├── Payment.cs
│   ├── Notification.cs
│   ├── Review.cs
│   └── Setting.cs
├── DTOs/Payment/...
├── DTOs/Notification/...
├── DTOs/Review/...
├── Services/
│   ├── PaymentService.cs
│   ├── NotificationService.cs
│   ├── ReviewService.cs
│   └── SettingService.cs
└── Controllers/
    ├── PaymentController.cs
    ├── NotificationController.cs
    ├── ReviewController.cs
    └── SettingController.cs
```

### 7.2 API

| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/payments/{auctionWinnerId}/mock-pay` | Người thắng đấu giá | Mô phỏng thanh toán |
| GET | `/api/payments/my` | Đã xác thực | Lịch sử thanh toán |
| GET | `/api/notifications` | Đã xác thực | Danh sách thông báo |
| GET | `/api/notifications/unread-count` | Đã xác thực | Số thông báo chưa đọc |
| PUT | `/api/notifications/{id}/read` | Đã xác thực | Đánh dấu đã đọc |
| POST | `/api/reviews` | Người thắng đấu giá | Gửi đánh giá |
| GET | `/api/reviews/product/{id}` | Công khai | Danh sách đánh giá của sản phẩm |
| GET / PUT | `/api/settings` | Quản trị viên | Xem hoặc cập nhật cấu hình hệ thống |

### 7.3 Model `Payment`

```csharp
public class Payment
{
    public int Id { get; set; }
    public int AuctionWinnerId { get; set; }

    [Required, MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public string? TransactionId { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public AuctionWinner AuctionWinner { get; set; } = null!;
}
```

Giá trị `PaymentMethod` được kiểm tra hợp lệ trong tầng Service theo danh sách cố định, không yêu cầu bảng tra cứu riêng:

```csharp
private static readonly string[] ValidMethods = { "VNPay", "Momo", "COD", "BankTransfer" };

if (!ValidMethods.Contains(dto.PaymentMethod))
    throw new AppException("Phương thức thanh toán không hợp lệ", 400);
```

### 7.4 Dịch vụ thông báo dùng chung

`NotificationService` được gọi từ cả ba module: Long gọi khi sản phẩm bị từ chối, khi có người bị vượt giá, và khi xác định người thắng; Hoàng có thể gọi khi tài khoản bị khóa. Interface cần hoàn thiện sớm và công bố cho toàn nhóm trong tuần đầu tiên:

```csharp
public interface INotificationService
{
    Task CreateAsync(int userId, string title, string message, string type,
                      string? relatedEntityType = null, int? relatedEntityId = null);
}
```

### 7.5 Việc cần hoàn thành

- Bốn Model tương ứng bốn bảng phụ trách
- Hoàn thiện `INotificationService.CreateAsync()` trong tuần đầu tiên, công bố chữ ký hàm cho Hoàng và Long
- `PaymentService`: mô phỏng thanh toán, kiểm tra tính hợp lệ của `PaymentMethod`
- `ReviewService`: chỉ người thắng đấu giá được đánh giá, mỗi sản phẩm chỉ đánh giá một lần
- `SettingService`: khởi tạo cấu hình mặc định cho `CommissionRate`, `MinBidAmount`
- API thống kê tổng quan (`/api/admin/dashboard`) tổng hợp từ dữ liệu sẵn có — không yêu cầu bảng mới

---

## 8. ĐIỂM PHỐI HỢP GIỮA CÁC MODULE

| Điểm phối hợp | Các bên liên quan | Nội dung cần thống nhất |
|---|---|---|
| `INotificationService` | Hằng cung cấp — Hoàng, Long sử dụng | Chữ ký hàm cố định từ tuần đầu tiên |
| Xác định người thắng | Long tạo `AuctionWinner` — Hằng khởi tạo `Payment` tương ứng | Long gọi `INotificationService` ngay sau khi tạo `AuctionWinner`; Hằng lắng nghe qua truy vấn `AuctionWinners` có `Status = Pending` chưa có `Payment` liên kết |
| `Reviews` phụ thuộc `AuctionWinners` | Hằng ↔ Long | Hằng truy vấn thông qua interface do Long cung cấp, không truy vấn trực tiếp bảng thuộc module khác |
| `AppDbContext.cs` | Cả ba module | Chỉ một người tạo migration tại một thời điểm; thông báo trước khi thực hiện |
| `Program.cs` | Cả ba module | Mỗi người chỉ bổ sung đăng ký dịch vụ (`AddScoped`) thuộc module của mình |

Thứ tự triển khai khuyến nghị: Module của Hoàng hoàn thiện phần xác thực cơ bản trước, vì `SellerId`, `BidderId`, `UserId` trong các bảng còn lại đều tham chiếu đến `Users`. Trong lúc chờ, Long và Hằng có thể khai báo khóa ngoại dạng `int` chưa gắn navigation property, bổ sung sau khi model `User` sẵn sàng.

---

## 9. KẾ HOẠCH TRIỂN KHAI

| Tuần | Hoàng | Long | Hằng |
|---|---|---|---|
| 1 | Khởi tạo `AppDbContext`, model `User`, API đăng ký và đăng nhập | Model `Category`, `Product` | Model `Payment`, `Notification`; hoàn thiện interface `INotificationService` |
| 2 | Refresh token, xác thực email, quên mật khẩu | CRUD sản phẩm, tải ảnh, model `Bid` | `PaymentService`, `NotificationService` hoàn chỉnh, `Setting` |
| 3 | Hỗ trợ kiểm thử chung | SignalR Hub, xử lý tương tranh khi đặt giá, `AuctionCloseService` | `Review`, tích hợp với `AuctionWinner` |
| 4 | Kiểm thử lại toàn bộ luồng xác thực | Hoàn thiện `WatchLists`, xử lý báo cáo vi phạm, kiểm thử tương tranh | API thống kê, hỗ trợ tích hợp toàn hệ thống |

Tuần cuối cùng của mỗi giai đoạn dành cho việc tích hợp giữa các module và kiểm thử luồng nghiệp vụ đầy đủ: đăng ký, xác thực email, đăng sản phẩm, duyệt, đấu giá, đóng phiên, thanh toán, đánh giá.

---

## 10. TIÊU CHÍ HOÀN THÀNH

Một chức năng được coi là hoàn thành khi đáp ứng đầy đủ:

- Biên dịch không lỗi, không cảnh báo nghiêm trọng
- Dữ liệu đầu vào được kiểm tra hợp lệ đầy đủ
- Phản hồi tuân theo đúng cấu trúc `ApiResponse<T>`
- Có mô tả Swagger cho từng endpoint
- Đã kiểm thử thủ công cả trường hợp hợp lệ và không hợp lệ
- Không để lộ thông tin nhạy cảm trong phản hồi
- Đã tạo Pull Request và được ít nhất một thành viên khác xem xét trước khi hợp nhất vào nhánh chính
- Không làm ảnh hưởng đến chức năng đã hoàn thành của hai module còn lại

---

**Tài liệu tham chiếu bổ sung:**
- Quy trình làm việc với Git và GitHub: `GITHUB-WORKFLOW-RULES.md`
- Hướng dẫn AI Agent phát triển frontend: `AGENTS.md`
