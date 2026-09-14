# TÀI LIỆU PHÂN CÔNG BACKEND
## Dự án: Hệ thống Đấu giá sản phẩm trực tuyến (Online Auction System)

**Công nghệ:** ASP.NET Core Web API (.NET 8), Entity Framework Core, SQL Server, SignalR, JWT
**Nhóm:** 3 thành viên | **Thời gian:** 4-5 tuần

---

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Thiết kế Database đầy đủ (SQL)](#2-thiết-kế-database-đầy-đủ-sql)
3. [Quy ước chung toàn dự án](#3-quy-ước-chung-toàn-dự-án)
4. [Người 1 — Auth & User Management](#4-người-1--auth--user-management)
5. [Người 2 — Product & Category Management](#5-người-2--product--category-management)
6. [Người 3 — Bidding, Real-time & Notification](#6-người-3--bidding-real-time--notification)
7. [Kế hoạch Sprint chi tiết (5 tuần)](#7-kế-hoạch-sprint-chi-tiết-5-tuần)
8. [Git Workflow chi tiết](#8-git-workflow-chi-tiết)
9. [Checklist bảo mật](#9-checklist-bảo-mật)
10. [Checklist kiểm thử](#10-checklist-kiểm-thử)
11. [Cấu hình môi trường](#11-cấu-hình-môi-trường)
12. [Tiêu chí hoàn thành (Definition of Done)](#12-tiêu-chí-hoàn-thành-definition-of-done)
13. [Dependency Injection & Program.cs đầy đủ](#13-dependency-injection--programcs-đầy-đủ)
14. [Event Contract SignalR (Backend ↔ Frontend)](#14-event-contract-signalr-backend--frontend)
15. [Enum thay cho chuỗi trạng thái](#15-enum-thay-cho-chuỗi-trạng-thái)
16. [Phần nâng cao — tùy chọn nếu còn thời gian](#16-phần-nâng-cao--tùy-chọn-nếu-còn-thời-gian)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Kiến trúc
```
Client (React + Vite)
        │  HTTP/REST + WebSocket (SignalR)
        ▼
Backend API (ASP.NET Core)
  ├── Controllers      → nhận request
  ├── Services         → business logic
  ├── Repositories     → truy vấn DB
  ├── Hubs             → real-time (SignalR)
  └── Data (EF Core)   → ORM
        │
        ▼
   SQL Server Database
```

### 1.2 Luồng nghiệp vụ chính
```
Seller đăng sản phẩm (Pending)
        ↓
Admin duyệt (Active)
        ↓
Buyer xem + đặt giá (real-time cập nhật cho mọi người xem)
        ↓
Hết giờ → hệ thống tự đóng phiên (Ended)
        ↓
Xác định người thắng → tạo Payment → gửi Notification
        ↓
Người thắng thanh toán (mock)
```

---

## 2. THIẾT KẾ DATABASE ĐẦY ĐỦ (SQL)

```sql
CREATE TABLE Users (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Username        NVARCHAR(50)  NOT NULL UNIQUE,
    Email           NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash    NVARCHAR(255) NOT NULL,
    FullName        NVARCHAR(100) NOT NULL,
    Phone           NVARCHAR(20)  NULL,
    Address         NVARCHAR(255) NULL,
    Role            NVARCHAR(20)  NOT NULL DEFAULT 'User', -- User, Seller, Admin
    IsActive        BIT           NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE Categories (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(100) NOT NULL,
    Description     NVARCHAR(255) NULL
);

CREATE TABLE Products (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    SellerId        INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    CategoryId      INT NOT NULL FOREIGN KEY REFERENCES Categories(Id),
    Title           NVARCHAR(200) NOT NULL,
    Description     NVARCHAR(MAX) NULL,
    ImageUrl        NVARCHAR(500) NULL,
    StartPrice      DECIMAL(18,2) NOT NULL,
    StepPrice       DECIMAL(18,2) NOT NULL DEFAULT 10000,
    CurrentPrice    DECIMAL(18,2) NOT NULL,
    StartTime       DATETIME2 NOT NULL,
    EndTime         DATETIME2 NOT NULL,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Active, Ended, Sold, Cancelled
    RowVersion      ROWVERSION,          -- dùng cho optimistic concurrency khi đặt giá
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE Bids (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    ProductId       INT NOT NULL FOREIGN KEY REFERENCES Products(Id),
    BidderId        INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Amount          DECIMAL(18,2) NOT NULL,
    BidTime         DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE Payments (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    ProductId       INT NOT NULL FOREIGN KEY REFERENCES Products(Id),
    WinnerId        INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Amount          DECIMAL(18,2) NOT NULL,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Paid, Failed
    PaidAt          DATETIME2 NULL
);

CREATE TABLE Notifications (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    ProductId       INT NULL FOREIGN KEY REFERENCES Products(Id),
    Message         NVARCHAR(500) NOT NULL,
    Type            NVARCHAR(30) NOT NULL, -- OutBid, Won, Lost, ProductApproved, ProductRejected
    IsRead          BIT NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Index tối ưu truy vấn thường dùng
CREATE INDEX IX_Products_Status_EndTime ON Products(Status, EndTime);
CREATE INDEX IX_Bids_ProductId_Amount ON Bids(ProductId, Amount DESC);
CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(UserId, IsRead);
```

### 2.1 ERD dạng text

```
Users 1───N Products        (Seller đăng sản phẩm)
Users 1───N Bids             (User đặt giá)
Users 1───N Notifications
Products 1───N Bids
Products 1───1 Payments
Categories 1───N Products
```

---

## 3. QUY ƯỚC CHUNG TOÀN DỰ ÁN

### 3.1 Response Format thống nhất

Mọi API — dù thành công hay lỗi — đều trả về đúng cấu trúc sau:

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
}
```

**Ví dụ thành công:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": 1, "username": "john", "role": "User" }
  },
  "errors": null
}
```

**Ví dụ lỗi:**
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "data": null,
  "errors": ["Email đã tồn tại", "Mật khẩu tối thiểu 6 ký tự"]
}
```

### 3.2 Mã lỗi HTTP chuẩn dùng chung

| Status Code | Khi nào dùng |
|---|---|
| `200 OK` | Thành công (GET, PUT thành công) |
| `201 Created` | Tạo mới thành công (POST) |
| `400 Bad Request` | Dữ liệu đầu vào sai / vi phạm validate |
| `401 Unauthorized` | Chưa đăng nhập / token hết hạn |
| `403 Forbidden` | Đã đăng nhập nhưng không đủ quyền |
| `404 Not Found` | Không tìm thấy resource |
| `409 Conflict` | Xung đột dữ liệu (VD: đặt giá bị người khác đặt trước) |
| `500 Internal Server Error` | Lỗi hệ thống — xử lý qua `ExceptionMiddleware` |

### 3.3 Naming Convention

| Đối tượng | Convention | Ví dụ |
|---|---|---|
| Class, Method (C#) | PascalCase | `ProductService`, `GetById()` |
| Biến local, param (C#) | camelCase | `productId`, `currentPrice` |
| Property JSON trả về | camelCase | `{ "productId": 1 }` (cấu hình trong `Program.cs`) |
| Route API | kebab-case, số nhiều | `/api/products`, `/api/bid-history` |
| Tên bảng DB | PascalCase, số nhiều | `Products`, `Bids` |
| Tên branch Git | `feature/<module>-<chức-năng>` | `feature/auth-login`, `feature/bid-realtime` |
| Tên migration | PascalCase mô tả thay đổi | `AddProductTable`, `AddRowVersionToProduct` |

### 3.4 Cấu hình JSON camelCase (thêm vào `Program.cs`, Người 1 phụ trách)

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
```

---

## 4. NGƯỜI 1 (Hằng)— Auth & User Management

### 4.1 Sơ đồ file sở hữu

```
backend/
├── Models/
│   └── User.cs
├── DTOs/Auth/
│   ├── RegisterDto.cs
│   ├── LoginDto.cs
│   └── AuthResponseDto.cs
├── DTOs/User/
│   ├── UserProfileDto.cs
│   └── UpdateProfileDto.cs
├── Services/
│   ├── Interfaces/IAuthService.cs
│   ├── AuthService.cs
│   ├── Interfaces/IUserService.cs
│   └── UserService.cs
├── Controllers/
│   ├── AuthController.cs
│   └── UserController.cs
├── Helpers/
│   ├── JwtHelper.cs
│   └── PasswordHelper.cs
├── Middlewares/
│   └── ExceptionMiddleware.cs
└── Data/AppDbContext.cs   (khởi tạo khung, dùng chung)
```

### 4.2 Package cần cài riêng cho module

```bash
dotnet add package BCrypt.Net-Next
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package System.IdentityModel.Tokens.Jwt
```

### 4.3 Model đầy đủ

```csharp
public class User
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    public string Role { get; set; } = "User"; // User | Seller | Admin
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Bid> Bids { get; set; } = new List<Bid>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
```

### 4.4 API Spec đầy đủ (Request/Response)

#### `POST /api/auth/register`
Request:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "123456",
  "fullName": "John Doe",
  "phone": "0901234567"
}
```
Validate:
- `username`: bắt buộc, 4-50 ký tự, không trùng
- `email`: đúng định dạng, không trùng
- `password`: tối thiểu 6 ký tự
- `fullName`: bắt buộc

Response `201`:
```json
{ "success": true, "message": "Đăng ký thành công", "data": { "id": 5, "username": "johndoe" } }
```

#### `POST /api/auth/login`
Request:
```json
{ "email": "john@example.com", "password": "123456" }
```
Response `200`:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOi...",
    "expiresAt": "2026-09-15T10:00:00Z",
    "user": { "id": 5, "username": "johndoe", "fullName": "John Doe", "role": "User" }
  }
}
```

#### `GET /api/users/me` — cần header `Authorization: Bearer <token>`
Response `200`:
```json
{ "success": true, "data": { "id": 5, "username": "johndoe", "email": "john@example.com", "role": "User" } }
```

#### `PUT /api/users/{id}/status` — Admin only
Request:
```json
{ "isActive": false }
```

### 4.5 JwtHelper — code mẫu đầy đủ

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

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
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

### 4.6 Cấu hình Authentication trong `Program.cs`

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };
    });

builder.Services.AddAuthorization();
```

### 4.7 Checklist chi tiết

- [ ] Cấu hình `AppDbContext` (bàn giao trước cho nhóm ngày đầu tiên)
- [ ] Model `User` + Fluent API config (unique index cho Email, Username)
- [ ] `PasswordHelper`: `Hash(string password)`, `Verify(string password, string hash)`
- [ ] `JwtHelper`: sinh token với claims `NameIdentifier`, `Role`
- [ ] `AuthService.RegisterAsync()`: check trùng email/username → hash password → lưu DB
- [ ] `AuthService.LoginAsync()`: verify password → sinh token → trả `AuthResponseDto`
- [ ] `AuthController`: 2 endpoint Register/Login, validate model qua `[ApiController]` tự động
- [ ] `UserController`: `GetProfile`, `UpdateProfile`, `GetAllUsers` (Admin), `ToggleStatus` (Admin)
- [ ] Cấu hình `[Authorize]` mặc định, `[AllowAnonymous]` riêng cho Register/Login
- [ ] `ExceptionMiddleware`: bắt exception toàn cục, trả về `ApiResponse` chuẩn, log lỗi
- [ ] Seed 1 Admin mặc định qua `AppDbContext.OnModelCreating` hoặc migration riêng
- [ ] Viết Swagger annotation đầy đủ cho từng endpoint
- [ ] Test bằng Postman: Register → Login → dùng token gọi `/me`

---

## 5. NGƯỜI 2 (Long) — Product & Category Management

### 5.1 Sơ đồ file sở hữu

```
backend/
├── Models/
│   ├── Product.cs
│   └── Category.cs
├── DTOs/Product/
│   ├── ProductCreateDto.cs
│   ├── ProductUpdateDto.cs
│   ├── ProductResponseDto.cs
│   └── ProductFilterDto.cs
├── DTOs/Category/
│   └── CategoryDto.cs
├── Services/
│   ├── Interfaces/IProductService.cs
│   ├── ProductService.cs
│   ├── Interfaces/ICategoryService.cs
│   ├── CategoryService.cs
│   └── FileUploadService.cs
├── Repositories/
│   ├── Interfaces/IProductRepository.cs
│   └── ProductRepository.cs
└── Controllers/
    ├── ProductController.cs
    └── CategoryController.cs
```

### 5.2 Model đầy đủ

```csharp
public class Category
{
    public int Id { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class Product
{
    public int Id { get; set; }
    public int SellerId { get; set; }
    public int CategoryId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }

    [Range(0, double.MaxValue)]
    public decimal StartPrice { get; set; }
    public decimal StepPrice { get; set; } = 10000;
    public decimal CurrentPrice { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = "Pending";

    [Timestamp]
    public byte[]? RowVersion { get; set; }   // dùng cho concurrency khi Người 3 đặt giá

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Seller { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<Bid> Bids { get; set; } = new List<Bid>();
}
```

### 5.3 API Spec đầy đủ

#### `GET /api/products?categoryId=&keyword=&minPrice=&maxPrice=&status=&page=1&pageSize=10`
Response `200`:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Đồng hồ cổ Thụy Sĩ",
        "imageUrl": "/uploads/abc.jpg",
        "currentPrice": 1500000,
        "endTime": "2026-09-20T15:00:00Z",
        "status": "Active",
        "categoryName": "Đồng hồ"
      }
    ],
    "totalItems": 42,
    "totalPages": 5,
    "currentPage": 1
  }
}
```

#### `POST /api/products` — role Seller
Request (multipart/form-data nếu kèm ảnh, hoặc JSON nếu upload ảnh riêng):
```json
{
  "categoryId": 2,
  "title": "Đồng hồ cổ Thụy Sĩ",
  "description": "Đồng hồ cổ đời 1960, còn nguyên bản",
  "startPrice": 1000000,
  "stepPrice": 50000,
  "startTime": "2026-09-15T08:00:00Z",
  "endTime": "2026-09-20T15:00:00Z"
}
```
Validate:
- `endTime > startTime`, `startTime` không được ở quá khứ
- `startPrice > 0`, `stepPrice > 0`
- `categoryId` phải tồn tại

Response `201`: trả về `ProductResponseDto` với `status = "Pending"`

#### `PUT /api/products/{id}/approve` — Admin only
Response `200`:
```json
{ "success": true, "message": "Đã duyệt sản phẩm", "data": { "id": 1, "status": "Active" } }
```

#### `PUT /api/products/{id}/reject` — Admin only *(bổ sung — trước đây chỉ có trong checklist, chưa có spec)*
Request:
```json
{ "reason": "Ảnh sản phẩm không rõ ràng, vui lòng đăng lại" }
```
Response `200`:
```json
{ "success": true, "message": "Đã từ chối sản phẩm", "data": { "id": 1, "status": "Cancelled" } }
```
Logic: đổi `Status = "Cancelled"`, đồng thời gọi `NotificationService` (của Người 3) tạo thông báo loại `ProductRejected` kèm `reason` cho Seller. Vì đây là điểm giao giữa 2 module, Người 2 chỉ cần gọi `INotificationService.CreateAsync(...)` — không cần biết chi tiết cài đặt bên trong.

#### `GET /api/products/my` — Seller *(bổ sung — API xem sản phẩm của chính mình)*
Query: `?status=&page=1&pageSize=10`
Response `200`: giống format `GET /api/products` nhưng chỉ trả sản phẩm có `SellerId == userId` lấy từ token, bao gồm cả trạng thái `Pending`/`Cancelled` (khác với API public chỉ nên mặc định lọc `Active`).

#### `POST /api/products/upload-image` — Seller, multipart/form-data
Response `200`:
```json
{ "success": true, "data": { "imageUrl": "/uploads/6f2a1c.jpg" } }
```

### 5.4 Logic lọc & phân trang — code mẫu Repository

```csharp
public async Task<(List<Product> items, int totalCount)> GetFilteredAsync(ProductFilterDto filter)
{
    var query = _context.Products
        .Include(p => p.Category)
        .Include(p => p.Seller)
        .AsQueryable();

    if (filter.CategoryId.HasValue)
        query = query.Where(p => p.CategoryId == filter.CategoryId);

    if (!string.IsNullOrEmpty(filter.Keyword))
        query = query.Where(p => p.Title.Contains(filter.Keyword));

    if (filter.MinPrice.HasValue)
        query = query.Where(p => p.CurrentPrice >= filter.MinPrice);

    if (filter.MaxPrice.HasValue)
        query = query.Where(p => p.CurrentPrice <= filter.MaxPrice);

    if (!string.IsNullOrEmpty(filter.Status))
        query = query.Where(p => p.Status == filter.Status);

    var total = await query.CountAsync();
    var items = await query
        .OrderBy(p => p.EndTime)
        .Skip((filter.Page - 1) * filter.PageSize)
        .Take(filter.PageSize)
        .ToListAsync();

    return (items, total);
}
```

### 5.5 Checklist chi tiết

- [ ] Model `Product`, `Category` + Fluent API (FK, index)
- [ ] `CategoryService`: CRUD đơn giản
- [ ] `ProductService.CreateAsync()`: gán `SellerId` từ token (`User.FindFirst`), set `CurrentPrice = StartPrice`, `Status = "Pending"`
- [ ] `ProductRepository`: filter, search, phân trang (code mẫu ở trên)
- [ ] `FileUploadService`: validate định dạng ảnh (jpg/png), giới hạn dung lượng (VD 5MB), lưu vào `wwwroot/uploads`, trả về URL
- [ ] `ProductController`: đầy đủ CRUD + `approve`/`reject` (Admin) + `upload-image` + `GET /products/my` (Seller)
- [ ] API `reject`: gọi `INotificationService` (module Người 3) để báo Seller lý do bị từ chối — thống nhất chữ ký interface với Người 3 từ đầu Sprint 1 để tránh phải sửa lại giữa chừng
- [ ] Kiểm tra quyền sở hữu: Seller chỉ sửa/xóa được sản phẩm của chính mình (so `SellerId` với token)
- [ ] Không cho sửa sản phẩm khi `Status != "Pending"` (đã Active thì khóa, tránh gian lận sửa giá giữa chừng)
- [ ] `CategoryController`: GET public, POST/PUT/DELETE Admin only
- [ ] Seed data: 5-6 danh mục mẫu
- [ ] Test đầy đủ luồng: tạo sản phẩm → Admin duyệt → hiển thị danh sách Active

### 5.6 Phụ thuộc & cách xử lý khi chưa có Người 1

Trong lúc chờ `User.cs` hoàn thiện, tạm khai báo:
```csharp
public int SellerId { get; set; }   // chưa gắn navigation property
```
Khi Người 1 push `User.cs` xong, bổ sung:
```csharp
public User Seller { get; set; } = null!;
```
rồi chạy lại migration.

---

## 6. NGƯỜI 3 (Hoàng) — Bidding, Real-time & Notification

### 6.1 Sơ đồ file sở hữu

```
backend/
├── Models/
│   ├── Bid.cs
│   ├── Notification.cs
│   └── Payment.cs
├── DTOs/Bid/
│   ├── BidCreateDto.cs
│   ├── BidResponseDto.cs
│   └── BidHistoryDto.cs
├── DTOs/Notification/
│   └── NotificationDto.cs
├── Services/
│   ├── Interfaces/IBidService.cs
│   ├── BidService.cs
│   ├── Interfaces/INotificationService.cs
│   ├── NotificationService.cs
│   └── AuctionCloseService.cs      (BackgroundService)
├── Controllers/
│   ├── BidController.cs
│   ├── NotificationController.cs
│   └── PaymentController.cs
└── Hubs/
    └── AuctionHub.cs
```

### 6.2 Package cần cài riêng

```bash
dotnet add package Microsoft.AspNetCore.SignalR
```
(Thường đã có sẵn trong ASP.NET Core, không cần cài thêm NuGet riêng — chỉ cần `using Microsoft.AspNetCore.SignalR;`)

### 6.3 Model đầy đủ

```csharp
public class Bid
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int BidderId { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Amount { get; set; }
    public DateTime BidTime { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
    public User Bidder { get; set; } = null!;
}

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? ProductId { get; set; }

    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // OutBid, Won, Lost, ProductApproved, ProductRejected
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Payment
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int WinnerId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Paid, Failed
    public DateTime? PaidAt { get; set; }
}
```

### 6.4 API Spec đầy đủ

#### `POST /api/bids`
Request:
```json
{ "productId": 1, "amount": 1600000 }
```
Response thành công `201`:
```json
{
  "success": true,
  "message": "Đặt giá thành công",
  "data": { "bidId": 55, "productId": 1, "amount": 1600000, "bidTime": "2026-09-14T10:30:00Z" }
}
```
Response lỗi `409` (giá không hợp lệ / bị người khác đặt trước):
```json
{ "success": false, "message": "Giá đặt phải lớn hơn hoặc bằng 1650000", "errors": [] }
```

#### `GET /api/bids/product/{productId}`
Response `200`:
```json
{
  "success": true,
  "data": [
    { "bidderName": "john***", "amount": 1600000, "bidTime": "2026-09-14T10:30:00Z" },
    { "bidderName": "mary***", "amount": 1550000, "bidTime": "2026-09-14T10:15:00Z" }
  ]
}
```
> Lưu ý: có thể ẩn bớt tên người đặt giá (che 1 phần) để bảo mật thông tin, tùy nhóm quyết định.

#### `GET /api/notifications/unread-count` *(bổ sung — trước đây thiếu, cần cho badge số thông báo chưa đọc trên frontend)*
Response `200`:
```json
{ "success": true, "data": { "count": 3 } }
```

#### Ghi chú chống spam đặt giá *(bổ sung)*
Đồ án môn học không bắt buộc rate-limit phức tạp, nhưng nên có ràng buộc tối thiểu để tránh 1 user bấm liên tục:
- Cách đơn giản: giới hạn ở tầng Service — không cho đặt giá mới nếu lượt đặt giá gần nhất của **chính user đó trên cùng sản phẩm** cách nhau dưới 2 giây.
- Cách nâng cao (tùy chọn, xem mục 16): dùng middleware rate-limiting của ASP.NET Core (`AddRateLimiter`).

### 6.5 BidService — Logic xử lý concurrency (điểm khó nhất)

```csharp
public async Task<BidResponseDto> PlaceBidAsync(int userId, BidCreateDto dto)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId);

        if (product == null)
            throw new AppException("Sản phẩm không tồn tại", 404);

        if (product.Status != "Active")
            throw new AppException("Sản phẩm không trong trạng thái đấu giá", 400);

        var now = DateTime.UtcNow;
        if (now < product.StartTime || now > product.EndTime)
            throw new AppException("Ngoài thời gian đấu giá", 400);

        if (product.SellerId == userId)
            throw new AppException("Không thể tự đặt giá sản phẩm của mình", 400);

        // FIX: trước đây thiếu — chặn user đã bị Admin khóa tài khoản vẫn đặt giá được
        var bidder = await _context.Users.FindAsync(userId);
        if (bidder == null || !bidder.IsActive)
            throw new AppException("Tài khoản của bạn đã bị khóa hoặc không tồn tại", 403);

        decimal minValidAmount = product.CurrentPrice + product.StepPrice;
        if (dto.Amount < minValidAmount)
            throw new AppException($"Giá đặt phải lớn hơn hoặc bằng {minValidAmount}", 409);

        // Cập nhật giá — EF Core sẽ tự kiểm tra RowVersion (concurrency token)
        product.CurrentPrice = dto.Amount;

        var bid = new Bid
        {
            ProductId = dto.ProductId,
            BidderId = userId,
            Amount = dto.Amount,
            BidTime = now
        };
        _context.Bids.Add(bid);

        // Auto-extend: nếu đặt giá trong 2 phút cuối, gia hạn thêm 2 phút
        if ((product.EndTime - now).TotalMinutes <= 2)
            product.EndTime = product.EndTime.AddMinutes(2);

        await _context.SaveChangesAsync();   // ném DbUpdateConcurrencyException nếu bị đè
        await transaction.CommitAsync();

        return new BidResponseDto { /* map dữ liệu trả về */ };
    }
    catch (DbUpdateConcurrencyException)
    {
        await transaction.RollbackAsync();
        throw new AppException("Có người khác vừa đặt giá, vui lòng thử lại", 409);
    }
}
```

> **Giải thích cơ chế chống đặt giá trùng lúc**: cột `RowVersion` (kiểu `rowversion`/`timestamp` trong SQL Server) tự động đổi giá trị mỗi khi row được update. EF Core kiểm tra version cũ có khớp không trước khi ghi — nếu 2 người cùng đặt giá cùng lúc, người thứ 2 sẽ bị lỗi `DbUpdateConcurrencyException`, phải thử lại. Đây là "optimistic concurrency control" — không cần lock DB, hiệu năng tốt hơn.

### 6.6 AuctionHub — SignalR đầy đủ

```csharp
public class AuctionHub : Hub
{
    public async Task JoinProductGroup(int productId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"product-{productId}");
    }

    public async Task LeaveProductGroup(int productId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"product-{productId}");
    }
}
```

Trong `BidService`, sau khi đặt giá thành công, tiêm `IHubContext<AuctionHub>` để bắn sự kiện:

```csharp
await _hubContext.Clients.Group($"product-{dto.ProductId}")
    .SendAsync("PriceUpdated", new {
        productId = dto.ProductId,
        newPrice = dto.Amount,
        bidderName = user.Username,
        bidTime = now
    });
```

**Gửi `OutBid` cho người vừa bị vượt giá** *(bổ sung — trước đây chỉ liệt kê tên sự kiện trong bảng, chưa có code)*. Cần lấy người đặt giá cao nhất **trước đó** (tức bid ngay trước bid vừa lưu), rồi gửi riêng cho người đó qua kết nối SignalR gắn với `UserId`:

```csharp
var previousTopBid = await _context.Bids
    .Where(b => b.ProductId == dto.ProductId && b.Id != bid.Id)
    .OrderByDescending(b => b.Amount)
    .FirstOrDefaultAsync();

if (previousTopBid != null && previousTopBid.BidderId != userId)
{
    // Lưu notification vào DB để hiện lại khi user load trang
    _context.Notifications.Add(new Notification
    {
        UserId = previousTopBid.BidderId,
        ProductId = dto.ProductId,
        Message = $"Bạn đã bị vượt giá cho sản phẩm '{product.Title}', giá mới: {dto.Amount:N0}đ",
        Type = "OutBid"
    });

    // Gửi real-time nếu người đó đang online
    await _hubContext.Clients.User(previousTopBid.BidderId.ToString())
        .SendAsync("OutBid", new { productId = dto.ProductId, newPrice = dto.Amount });
}
await _context.SaveChangesAsync();
```

> Để `Clients.User(userId)` hoạt động, cần cấu hình `IUserIdProvider` để SignalR map `ConnectionId` với `UserId` lấy từ JWT claim — xem ví dụ ở mục 13.

Cấu hình map Hub trong `Program.cs` (phối hợp với Người 1):
```csharp
app.MapHub<AuctionHub>("/hubs/auction");
```

### 6.7 AuctionCloseService — Background job tự động đóng phiên

```csharp
public class AuctionCloseService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;

    public AuctionCloseService(IServiceProvider serviceProvider)
        => _serviceProvider = serviceProvider;

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
                    .OrderByDescending(b => b.Amount)
                    .FirstOrDefaultAsync(stoppingToken);

                product.Status = winningBid != null ? "Sold" : "Ended";

                if (winningBid != null)
                {
                    context.Payments.Add(new Payment
                    {
                        ProductId = product.Id,
                        WinnerId = winningBid.BidderId,
                        Amount = winningBid.Amount,
                        Status = "Pending"
                    });

                    context.Notifications.Add(new Notification
                    {
                        UserId = winningBid.BidderId,
                        ProductId = product.Id,
                        Message = $"Chúc mừng! Bạn đã thắng đấu giá sản phẩm '{product.Title}'",
                        Type = "Won"
                    });
                }

                await hubContext.Clients.Group($"product-{product.Id}")
                    .SendAsync("AuctionEnded", new { productId = product.Id, status = product.Status });
            }

            await context.SaveChangesAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken); // quét mỗi 30 giây
        }
    }
}
```

Đăng ký trong `Program.cs`:
```csharp
builder.Services.AddHostedService<AuctionCloseService>();
```

### 6.8 Checklist chi tiết

- [ ] Model `Bid`, `Notification`, `Payment` + Fluent API
- [ ] Thêm `RowVersion` (`[Timestamp]`) vào `Product` (phối hợp với Người 2)
- [ ] `BidService.PlaceBidAsync()`: đầy đủ validate + transaction + concurrency (code mẫu ở trên)
- [ ] `AuctionHub`: `JoinProductGroup`, `LeaveProductGroup`
- [ ] Bắn sự kiện `PriceUpdated` sau mỗi lượt đặt giá thành công
- [ ] Bắn sự kiện `OutBid` cho người bị vượt giá (query `Bids` tìm người có `Amount` cao thứ 2 trước đó)
- [ ] Logic auto-extend thời gian (đã có trong code mẫu)
- [ ] `AuctionCloseService`: BackgroundService quét mỗi 30s, đóng phiên hết giờ, tạo Payment + Notification
- [ ] `NotificationController`: GET danh sách, PUT đánh dấu đã đọc
- [ ] `PaymentController`: mock thanh toán — set `Status = "Paid"`, `PaidAt = DateTime.UtcNow`
- [ ] Map Hub trong `Program.cs`, cấu hình CORS cho phép SignalR (khác với CORS REST thường)
- [ ] Test kịch bản: 2 tab trình duyệt cùng đặt giá 1 sản phẩm → xác nhận cả 2 đều thấy giá cập nhật real-time

### 6.9 Lưu ý CORS riêng cho SignalR

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();     // BẮT BUỘC true để SignalR hoạt động
    });
});
```

---

## 7. KẾ HOẠCH SPRINT CHI TIẾT (5 TUẦN)

### Sprint 1 (Tuần 1) — Nền móng
| Người 1 | Người 2 | Người 3 |
|---|---|---|
| Setup `AppDbContext`, connection string, migration đầu tiên | Model `Product`, `Category` (SellerId tạm chưa FK) | Setup SignalR cơ bản, đọc tài liệu, thiết kế event contract |
| Model `User`, cấu hình JWT trong `Program.cs` | Thiết kế DTO Product | Model `Bid`, `Notification`, `Payment` |
| API Register/Login | | |

**Milestone cuối tuần 1**: Đăng ký/đăng nhập chạy được qua Swagger, có token JWT hợp lệ.

### Sprint 2 (Tuần 2) — CRUD cơ bản
| Người 1 | Người 2 | Người 3 |
|---|---|---|
| API Profile, phân quyền Admin | API CRUD Product + Category | API đặt giá cơ bản (chưa real-time) |
| Middleware Exception | Upload ảnh | Validate business rule đặt giá |
| Seed Admin mặc định | Filter + phân trang | |

**Milestone cuối tuần 2**: Tạo được sản phẩm, đặt giá cơ bản qua Postman (chưa real-time).

### Sprint 3 (Tuần 3) — Tính năng nâng cao
| Người 1 | Người 2 | Người 3 |
|---|---|---|
| Hỗ trợ debug chung, code review | API duyệt/từ chối sản phẩm (Admin) | SignalR Hub hoàn chỉnh |
| Refresh token (nếu làm) | Hoàn thiện search nâng cao | Auto-extend, concurrency control |

**Milestone cuối tuần 3**: Đặt giá cập nhật real-time giữa nhiều client.

### Sprint 4 (Tuần 4) — Hoàn thiện & tích hợp
| Cả 3 người |
|---|
| Tích hợp toàn bộ module, sửa lỗi phát sinh khi ráp nối |
| Background job đóng phiên đấu giá tự động |
| Mock Payment, Notification hoàn chỉnh |
| Viết Swagger đầy đủ, dọn code thừa |

### Sprint 5 (Tuần 5) — Kiểm thử & báo cáo
| Cả 3 người |
|---|
| Test toàn bộ luồng nghiệp vụ (đăng ký → đăng sản phẩm → duyệt → đấu giá → thắng → thanh toán) |
| Sửa bug phát hiện khi test chung với frontend |
| Chuẩn bị slide báo cáo, quay video demo |

---

## 8. GIT WORKFLOW CHI TIẾT

### 8.1 Cấu trúc branch

```
main                     ← code ổn định, chỉ merge qua Pull Request
 ├── feature/auth-register
 ├── feature/auth-login
 ├── feature/product-crud
 ├── feature/product-upload
 ├── feature/bid-realtime
 └── feature/bid-autoclose
```

### 8.2 Quy trình chuẩn mỗi khi làm 1 chức năng

```bash
git checkout main
git pull origin main
git checkout -b feature/auth-login

# ... code ...

git add .
git commit -m "feat(auth): implement login API with JWT"
git push origin feature/auth-login
```

Sau đó lên GitHub → **New Pull Request** → chọn base `main` ← compare `feature/auth-login` → nhờ 1 bạn review → **Merge**.

### 8.3 Quy ước commit message

```
feat(module): thêm tính năng mới
fix(module): sửa lỗi
refactor(module): tái cấu trúc code, không đổi hành vi
docs: cập nhật tài liệu
chore: cập nhật cấu hình, package
```

Ví dụ thực tế:
```
feat(bid): add optimistic concurrency control for placing bid
fix(product): fix filter not working when categoryId is null
refactor(auth): extract password hashing into PasswordHelper
```

### 8.4 Xử lý migration tránh xung đột

- **Chỉ 1 người tạo migration mỗi lần**, báo trước trong nhóm chat
- Trước khi tạo migration mới, luôn `git pull` để lấy migration mới nhất của người khác
- Nếu bị conflict ở file `Migrations/`, **không tự sửa tay** — xóa migration lỗi, chạy lại:
```bash
dotnet ef migrations remove
dotnet ef migrations add <TenMoi>
```

---

## 9. CHECKLIST BẢO MẬT

- [ ] Password luôn hash bằng BCrypt, không lưu plain text
- [ ] JWT secret key đủ dài (tối thiểu 32 ký tự), lưu trong `appsettings.json` — **không commit file chứa secret thật lên Git công khai** (dùng `appsettings.Development.json` local, thêm vào `.gitignore` nếu cần)
- [ ] Validate toàn bộ input ở Controller (dùng Data Annotations hoặc FluentValidation)
- [ ] Không trả `PasswordHash` trong bất kỳ response nào (dùng DTO, không trả thẳng Entity)
- [ ] Check quyền sở hữu (Seller chỉ sửa sản phẩm của mình, User chỉ xem profile của mình)
- [ ] Chống SQL Injection: dùng EF Core (LINQ), tuyệt đối không nối chuỗi SQL thủ công
- [ ] Giới hạn dung lượng và định dạng file khi upload ảnh
- [ ] Cấu hình CORS chỉ cho phép đúng domain frontend, không để `AllowAnyOrigin` khi dùng `AllowCredentials`

---

## 10. CHECKLIST KIỂM THỬ

### 10.1 Test thủ công qua Swagger/Postman (mỗi người tự test module của mình)

**Auth:**
- [ ] Đăng ký với email đã tồn tại → trả lỗi 400
- [ ] Đăng nhập sai mật khẩu → trả lỗi 401
- [ ] Gọi API cần token mà không có token → trả lỗi 401
- [ ] Gọi API Admin bằng token User thường → trả lỗi 403

**Product:**
- [ ] Tạo sản phẩm với `endTime < startTime` → lỗi 400
- [ ] Seller A sửa sản phẩm của Seller B → lỗi 403
- [ ] Lọc sản phẩm theo category + khoảng giá → đúng kết quả

**Bid:**
- [ ] Đặt giá thấp hơn giá hiện tại + bước giá → lỗi 409
- [ ] Đặt giá cho sản phẩm đã `Ended` → lỗi 400
- [ ] Seller tự đặt giá sản phẩm của mình → lỗi 400
- [ ] 2 tab đặt giá cùng lúc → chỉ 1 người thành công, người kia nhận lỗi 409 rõ ràng

### 10.2 Test tích hợp cả nhóm (cuối mỗi sprint)
- [ ] Luồng đầy đủ: Đăng ký → Đăng nhập → Đăng sản phẩm → Admin duyệt → User khác đặt giá → real-time cập nhật → hết giờ → xác định người thắng

---

## 11. CẤU HÌNH MÔI TRƯỜNG

### 11.1 `appsettings.json` mẫu

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=OnlineAuctionDB;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Secret": "day-la-chuoi-bi-mat-toi-thieu-32-ky-tu-cho-jwt",
    "Issuer": "OnlineAuctionAPI",
    "Audience": "OnlineAuctionClient"
  },
  "AllowedOrigins": "http://localhost:5173"
}
```

### 11.2 Danh sách package NuGet cần cài đầy đủ (chạy 1 lần ở thư mục `backend`)

```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection
dotnet add package Swashbuckle.AspNetCore
```

### 11.3 Lệnh migration cần nhớ

```bash
# Tạo migration mới
dotnet ef migrations add <TenMigration>

# Áp dụng vào database
dotnet ef database update

# Xóa migration cuối (nếu lỡ sai, CHƯA update database)
dotnet ef migrations remove
```

---

## 12. TIÊU CHÍ HOÀN THÀNH (Definition of Done)

Một API/chức năng được coi là **hoàn thành** khi đạt đủ các điều kiện sau:

- [ ] Code chạy được, không lỗi biên dịch, không warning nghiêm trọng
- [ ] Có validate đầy đủ input (không tin dữ liệu từ client)
- [ ] Trả về đúng `ApiResponse<T>` chuẩn của dự án
- [ ] Có annotation Swagger mô tả rõ endpoint, request/response mẫu
- [ ] Đã test thủ công qua Swagger/Postman với cả trường hợp đúng và trường hợp lỗi
- [ ] Không có thông tin nhạy cảm (password hash, secret key) bị lộ trong response
- [ ] Đã tạo Pull Request, có ít nhất 1 thành viên khác review trước khi merge vào `main`
- [ ] Không phá vỡ chức năng đã có của 2 module còn lại (test lại nhanh sau khi merge)

---

---

## 13. DEPENDENCY INJECTION & PROGRAM.CS ĐẦY ĐỦ

> *Phần này bổ sung theo góp ý: bản trước chỉ rải rác cấu hình JWT/CORS ở từng mục, chưa có một file `Program.cs` hoàn chỉnh để cả nhóm đối chiếu khi merge. Người 1 giữ file này, nhưng cả 3 người đều cần biết thứ tự middleware vì rất dễ merge conflict ở đúng file này.*

### 13.1 Quy tắc đăng ký Service (lifetime)

| Loại | Lifetime | Lý do |
|---|---|---|
| `AppDbContext` | Scoped (mặc định của `AddDbContext`) | Mỗi request 1 instance, tránh xung đột tracking entity |
| `IAuthService`, `IUserService`, `IProductService`, `IBidService`, `INotificationService`, `ICategoryService` | **Scoped** | Dùng chung `DbContext` trong 1 request |
| `JwtHelper`, `PasswordHelper` | **Singleton** (không giữ state theo request) hoặc Scoped đều được — khuyến nghị Singleton vì không đụng DB |
| `AuctionCloseService` | **Hosted Service** (`AddHostedService`) — chạy nền suốt vòng đời ứng dụng, tự tạo `Scope` riêng bên trong để lấy `DbContext` (xem code mục 6.7) |
| `AuctionHub` | Không cần đăng ký DI thủ công — SignalR tự quản lý, chỉ cần `AddSignalR()` |

### 13.2 File `Program.cs` đầy đủ (bản tổng hợp cả 3 module)

```csharp
var builder = WebApplication.CreateBuilder(args);

// 1. DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Đăng ký Service theo từng module (Scoped)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IBidService, BidService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<FileUploadService>();

// 3. Helper (Singleton vì không dùng DbContext)
builder.Services.AddSingleton<JwtHelper>();
builder.Services.AddSingleton<PasswordHelper>();

// 4. AutoMapper (nếu dùng — xem ví dụ mục 13.3)
builder.Services.AddAutoMapper(typeof(Program));

// 5. Controllers + JSON camelCase
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

// 6. Authentication (JWT) — chi tiết xem mục 4.6
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };

        // Bắt buộc để SignalR nhận được JWT qua query string (trình duyệt không gửi được header cho WebSocket)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// 7. SignalR + UserIdProvider (để Clients.User(userId) hoạt động đúng)
builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserIdProvider, NameIdentifierUserIdProvider>();

// 8. CORS — BẮT BUỘC AllowCredentials cho SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(builder.Configuration["AllowedOrigins"]!.Split(','))
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 9. Background job đóng phiên đấu giá (Người 3)
builder.Services.AddHostedService<AuctionCloseService>();

// 10. Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // Cấu hình để Swagger UI có ô nhập Bearer token, test API cần Authorize được luôn
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ===== THỨ TỰ MIDDLEWARE — RẤT QUAN TRỌNG, KHÔNG ĐỔI THỨ TỰ =====
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionMiddleware>();   // bắt lỗi sớm nhất có thể
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");               // phải đứng TRƯỚC Authentication
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<AuctionHub>("/hubs/auction");

app.Run();
```

### 13.3 `IUserIdProvider` — để `Clients.User(userId)` gửi đúng người

```csharp
public class NameIdentifierUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
        => connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
```
Không có class này, `_hubContext.Clients.User(userId.ToString())` trong phần `OutBid` (mục 6.5) sẽ **không gửi được cho ai cả** — đây là lỗi rất dễ mắc phải, cần nhớ đăng ký.

### 13.4 Ví dụ dùng AutoMapper thật (thay vì chỉ khai báo package)

```csharp
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Product, ProductResponseDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name))
            .ForMember(dest => dest.SellerName, opt => opt.MapFrom(src => src.Seller.FullName));

        CreateMap<User, UserProfileDto>();   // tự map field trùng tên, không lộ PasswordHash vì DTO không có field này
    }
}
```
Dùng trong Service: `var dto = _mapper.Map<ProductResponseDto>(product);` — giúp code Controller/Service gọn hơn, không phải gán tay từng field.

---

## 14. EVENT CONTRACT SIGNALR (BACKEND ↔ FRONTEND)

> *Phần này bổ sung theo góp ý: đây là "hợp đồng" quan trọng nhất giữa Người 3 (backend) và team frontend — cần tách thành bảng riêng, không để rải rác trong text.*

### 14.1 Bảng sự kiện đầy đủ

| Sự kiện | Hướng | Nhóm/Đích nhận | Payload mẫu | Khi nào bắn |
|---|---|---|---|---|
| `JoinProductGroup` | Client → Server | — | `productId: number` | Client gọi khi vào trang chi tiết sản phẩm |
| `LeaveProductGroup` | Client → Server | — | `productId: number` | Client gọi khi rời trang chi tiết sản phẩm |
| `PriceUpdated` | Server → Client | Group `product-{id}` | `{ productId, newPrice, bidderName, bidTime }` | Ngay sau khi 1 lượt đặt giá lưu DB thành công |
| `OutBid` | Server → Client | Riêng `User(userId)` | `{ productId, newPrice, message }` | Khi có người đặt giá cao hơn người đang giữ giá cao nhất |
| `AuctionEnded` | Server → Client | Group `product-{id}` | `{ productId, status, winnerId? }` | Khi `AuctionCloseService` đóng phiên (mục 6.7) |
| `TimeExtended` | Server → Client | Group `product-{id}` | `{ productId, newEndTime }` | Khi có bid trong 2 phút cuối, hệ thống tự gia hạn |
| `NotificationReceived` | Server → Client | Riêng `User(userId)` | `{ id, message, type, productId, createdAt }` | Bất kỳ lúc nào `NotificationService` tạo thông báo mới (Won, ProductApproved, ProductRejected...) |

### 14.2 Route Hub

```
wss://<backend-domain>/hubs/auction?access_token=<JWT>
```
Frontend dùng `@microsoft/signalr`, gắn token qua `accessTokenFactory` khi build connection — **không gắn qua header** vì WebSocket không hỗ trợ custom header khi handshake từ trình duyệt.

### 14.3 Ví dụ kết nối phía Frontend (tham khảo, để 2 team khớp API)

```javascript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${import.meta.env.VITE_API_URL}/hubs/auction`, {
    accessTokenFactory: () => useAuthStore.getState().token
  })
  .withAutomaticReconnect()
  .build();

connection.on("PriceUpdated", (data) => {
  useAuctionStore.getState().updatePrice(data.productId, data.newPrice);
});

connection.on("OutBid", (data) => {
  // hiển thị toast cảnh báo bị vượt giá
});

await connection.start();
await connection.invoke("JoinProductGroup", productId);
```

---

## 15. ENUM THAY CHO CHUỖI TRẠNG THÁI

> *Phần này bổ sung theo góp ý: dùng `string` cho `Status`/`Role`/`Type` dễ gõ sai chính tả (`"Actve"` thay vì `"Active"`) mà compiler không bắt được lỗi. Đổi sang enum giúp an toàn kiểu dữ liệu hơn, nhưng vẫn lưu dạng string trong DB để dễ đọc khi debug trực tiếp SQL.*

```csharp
public enum UserRole { User, Seller, Admin }

public enum ProductStatus { Pending, Active, Ended, Sold, Cancelled }

public enum PaymentStatus { Pending, Paid, Failed }

public enum NotificationType { OutBid, Won, Lost, ProductApproved, ProductRejected }
```

Cấu hình EF Core lưu enum dạng chuỗi thay vì số (dễ đọc trong SQL Server Management Studio khi debug):

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Product>()
        .Property(p => p.Status)
        .HasConversion<string>();

    modelBuilder.Entity<User>()
        .Property(u => u.Role)
        .HasConversion<string>();
}
```

**Lưu ý khi áp dụng**: đây là thay đổi có ảnh hưởng đến cả 3 module (Product dùng `ProductStatus`, User dùng `UserRole`, Notification dùng `NotificationType`). Nên quyết định dùng enum hay string **ngay từ Sprint 1** và thống nhất cả nhóm — tránh vừa code vừa đổi giữa chừng sẽ mất công sửa lại migration nhiều lần. Nếu nhóm thấy gấp thời gian, dùng `string` như bản gốc vẫn chạy đúng, enum chỉ là cải thiện về độ an toàn kiểu dữ liệu chứ không phải bắt buộc để hệ thống hoạt động.

---

## 16. PHẦN NÂNG CAO — TÙY CHỌN NẾU CÒN THỜI GIAN

> *Các mục dưới đây được tách riêng theo góp ý: đây là những điểm một dự án thật cần có, nhưng với đồ án môn học 4-5 tuần / 3 người, đưa vào phần bắt buộc sẽ khiến nhóm quá tải. Coi đây là "điểm cộng" nếu nhóm hoàn thành sớm phần lõi.*

### 16.1 Refresh Token
Thiết kế thêm bảng:
```sql
CREATE TABLE RefreshTokens (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    UserId      INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Token       NVARCHAR(255) NOT NULL,
    ExpiresAt   DATETIME2 NOT NULL,
    IsRevoked   BIT NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```
API bổ sung: `POST /api/auth/refresh-token`, `POST /api/auth/logout` (revoke token).

### 16.2 Soft-delete cho Product
Thêm `IsDeleted BIT DEFAULT 0` thay vì xóa cứng, cấu hình EF Core Global Query Filter:
```csharp
modelBuilder.Entity<Product>().HasQueryFilter(p => !p.IsDeleted);
```

### 16.3 Audit field
Thêm `CreatedBy`, `UpdatedAt`, `UpdatedBy` vào các bảng chính để phục vụ truy vết khi báo cáo/bảo vệ đồ án.

### 16.4 Logging có cấu trúc
Thay `Console.WriteLine` bằng `ILogger<T>` sẵn có của .NET, hoặc cài `Serilog` nếu muốn ghi log ra file:
```bash
dotnet add package Serilog.AspNetCore
```

### 16.5 Rate limiting cho API đặt giá
```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("BidPolicy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromSeconds(10);
    });
});
```
Gắn `[EnableRateLimiting("BidPolicy")]` lên `BidController`.

### 16.6 Unit test cho phần logic quan trọng nhất
Ưu tiên viết test cho `BidService.PlaceBidAsync` (nơi có concurrency, dễ có bug ẩn nhất) bằng `xUnit` + `Moq` hoặc EF Core InMemory Database:
```bash
dotnet new xunit -n backend.Tests
dotnet add backend.Tests reference backend/backend.csproj
dotnet add backend.Tests package Microsoft.EntityFrameworkCore.InMemory
```

### 16.7 Docker hóa (nếu giảng viên yêu cầu demo bằng container)
```dockerfile
# backend/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "backend.dll"]
```
Kèm `docker-compose.yml` chạy song song SQL Server + API nếu muốn demo môi trường gần giống production.

### 16.8 Connection string cho môi trường Linux/Docker
Ghi chú theo góp ý: `Trusted_Connection=True` chỉ chạy được trên Windows. Nếu deploy trên Linux/Docker, cần đổi sang xác thực bằng user/password:
```
Server=sqlserver,1433;Database=OnlineAuctionDB;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True
```

---

*Tài liệu này nên được cập nhật liên tục trong quá trình code — khi phát sinh thay đổi về API hoặc Model, người phụ trách module đó cập nhật lại phần tương ứng để cả nhóm luôn đồng bộ thông tin.*
