# THIẾT KẾ CHI TIẾT BẢNG DỮ LIỆU — MODULE 1: XÁC THỰC & NGƯỜI DÙNG

**Người phụ trách:** Hoàng
**Công nghệ:** ASP.NET Core Web API (.NET 8), Entity Framework Core, SQL Server
**Tài liệu gốc:** `TAI-LIEU-KY-THUAT-BACKEND.md` (mục 2.3, 2.4, 2.5, 5)

> Ký hiệu: cột có đánh dấu *(mới)* là cột **đề xuất thêm** so với tài liệu gốc. Cột không đánh dấu là cột đã có trong mục 2.3 của tài liệu gốc, được giữ nguyên và bổ sung quy tắc chi tiết.

---

## MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Bảng Users](#2-bảng-users)
3. [Bảng RefreshTokens](#3-bảng-refreshtokens)
4. [Bảng UserVerificationTokens](#4-bảng-userverificationtokens)
5. [Cơ chế audit và xóa mềm](#5-cơ-chế-audit-và-xóa-mềm)
6. [Entity C# và cấu hình Fluent API](#6-entity-c-và-cấu-hình-fluent-api)
7. [Quy trình nghiệp vụ liên quan đến dữ liệu](#7-quy-trình-nghiệp-vụ-liên-quan-đến-dữ-liệu)
8. [Đối chiếu thay đổi so với tài liệu gốc](#8-đối-chiếu-thay-đổi-so-với-tài-liệu-gốc)
9. [Các điểm cần chốt với nhóm](#9-các-điểm-cần-chốt-với-nhóm)
10. [Danh sách kiểm tra](#10-danh-sách-kiểm-tra)

---

## 1. TỔNG QUAN

### 1.1 Phạm vi

| Bảng | Mô tả | Có audit đầy đủ (6 cột)? |
|---|---|---|
| Users | Người dùng và phân quyền | **Có** |
| RefreshTokens | Token làm mới phiên đăng nhập | Không |
| UserVerificationTokens | Xác thực email và đặt lại mật khẩu | Không |

**Lý do chỉ `Users` có đủ 6 cột audit** (`CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`, `DeletedAt`, `DeletedBy`):

- `Users` là bảng có nhiều bên tác động: chính người dùng tự sửa hồ sơ, Admin khóa hoặc mở khóa, Admin xóa. Cần biết **ai** làm và **khi nào**.
- `RefreshTokens` và `UserVerificationTokens` do hệ thống tự sinh. `CreatedBy` luôn trùng `UserId`. Không có thao tác "sửa" hay "xóa" bởi người khác, trạng thái được thể hiện bằng `IsRevoked`/`RevokedAt` và `IsUsed`/`UsedAt`.

### 1.2 Sơ đồ quan hệ

```
Users (1) ──────< (N) RefreshTokens
Users (1) ──────< (N) UserVerificationTokens
Users (1) ──────< (N) Products [Seller]        (module Long)
Users (1) ──────< (N) Bids [Bidder]            (module Long)
Users (1) ──────< (N) Notifications            (module Hằng)
...
Users (1) ──────< (N) Users [CreatedBy / UpdatedBy / DeletedBy]   (tự tham chiếu)
RefreshTokens (1) ─ (0..1) RefreshTokens [ReplacedByToken]        (tự tham chiếu)
```

### 1.3 Nguyên tắc chung

- Mọi thời điểm lưu theo **UTC** (`DATETIME2`, mặc định `GETUTCDATE()`).
- Khóa chính (`Id`) là **UUID v4** (`UNIQUEIDENTIFIER` trong SQL Server, `Guid` trong C#), sinh ở tầng ứng dụng bằng `Guid.NewGuid()`. Mọi khóa ngoại trỏ tới bảng của module này cũng là `UNIQUEIDENTIFIER`.
- Route dùng ràng buộc kiểu: `/api/users/{id:guid}`.
- **Không xóa cứng `Users`**. Bảng `Products.SellerId` là `NO ACTION` nên xóa cứng sẽ lỗi, đồng thời cần giữ lịch sử đặt giá và giao dịch. Chỉ khóa (`IsActive`) hoặc xóa mềm (`DeletedAt`).
- Không trả `PasswordHash`, `Token` của `RefreshTokens` hay `UserVerificationTokens` trong bất kỳ phản hồi nào ngoài luồng phát hành token.

### 1.4 Lưu ý khi dùng UUID v4 làm khóa chính

| Vấn đề | Chi tiết | Cách xử lý |
|---|---|---|
| Sinh ID | EF Core mặc định sinh **GUID tuần tự** cho SQL Server, không phải UUID v4 | Gán `Id = Guid.NewGuid()` trong entity và cấu hình `ValueGeneratedNever()` (mục 6). `Guid.NewGuid()` của .NET sinh UUID v4 |
| Phân mảnh index | Clustered index trên GUID ngẫu nhiên gây page split ở mỗi lần insert, chậm dần khi bảng lớn | Với quy mô dự án này chấp nhận được. Nếu cần tối ưu: đặt PK là `NONCLUSTERED` và tạo clustered index trên `CreatedAt` |
| Dung lượng | 16 byte so với 4 byte của `INT`. Mỗi khóa ngoại và mỗi index chứa PK đều lớn hơn | Chấp nhận |
| Sắp xếp | `Id` không tăng theo thời gian | Không dùng `OrderBy(Id)` để lấy bản ghi mới nhất, dùng `CreatedAt` |
| Route và DTO | JSON trả về dạng chuỗi `"3f2504e0-4f89-11d3-9a0c-0305e82c3301"` | Dùng `{id:guid}` để sai định dạng trả 404, DTO khai báo kiểu `Guid` |
| JWT | Claim `NameIdentifier` là chuỗi GUID | Đọc bằng `Guid.Parse` hoặc `Guid.TryParse` |
| Bảo mật | UUID khó đoán nhưng **không thay thế** kiểm tra quyền | Vẫn kiểm tra chính chủ hoặc Admin ở service |
| Ảnh hưởng module khác | Mọi cột trỏ vào `Users(Id)` phải đổi sang `UNIQUEIDENTIFIER`: `Products.SellerId`, `Products.ApprovedBy`, `Bids.BidderId`, `AuctionWinners.WinnerId`, `Notifications.UserId`, `WatchLists.UserId`, `Reviews.ReviewerId`, `ReportedProducts.ReporterId`, `ReportedProducts.ResolvedBy` | Thông báo cho Long và Hằng trước khi họ viết model (xem mục 9) |

---

## 2. BẢNG USERS

### 2.1 Danh sách cột

| Cột | Kiểu SQL / C# | Ràng buộc | Quy tắc & ghi chú |
|---|---|---|---|
| Id | UNIQUEIDENTIFIER / `Guid` | PK, DEFAULT `NEWID()` | UUID v4, sinh bằng `Guid.NewGuid()` ở tầng ứng dụng. Các module khác khai báo khóa ngoại kiểu `Guid` |
| Username | NVARCHAR(50) / `string` | NOT NULL, unique trong nhóm chưa xóa (`UQ_Users_Username`) | 3–50 ký tự, chỉ gồm chữ, số, `_`, `.`. Không phân biệt hoa thường (collation mặc định). Đưa vào claim `Name` của JWT |
| Email | NVARCHAR(100) / `string` | NOT NULL, unique trong nhóm chưa xóa (`UQ_Users_Email`) | Trim và `ToLowerInvariant()` trước khi lưu và trước khi so sánh. Kiểm tra bằng `[EmailAddress]` |
| PasswordHash | NVARCHAR(255) / `string` | NOT NULL | Lưu hash BCrypt (khoảng 60 ký tự, ví dụ dùng `BCrypt.Net-Next`). Gắn `[JsonIgnore]`, không đưa vào DTO response nào |
| FullName | NVARCHAR(100) / `string` | NOT NULL | 2–100 ký tự, trim |
| Phone | NVARCHAR(20) / `string?` | NULL | Regex số VN: `^(0\|\+84)\d{9}$` |
| Address | NVARCHAR(255) / `string?` | NULL | Tối đa 255 ký tự |
| AvatarUrl | NVARCHAR(500) / `string?` | NULL | Lưu đường dẫn tương đối. Mục 5.2 chưa có endpoint upload avatar nên hiện chỉ nhận URL qua `PUT /api/users/me` |
| Role | NVARCHAR(20) / `string` | NOT NULL, DEFAULT `'User'`, `CK_Users_Role` | Chỉ nhận `User`, `Seller`, `Admin`. Khai báo hằng trong `static class Roles`. Đăng ký luôn gán `User`, `RegisterDto` **không có** trường Role |
| IsActive | BIT / `bool` | NOT NULL, DEFAULT 1 | `false` nghĩa là bị Admin **khóa** (có thể mở lại). Kiểm tra ở cả login và refresh-token |
| IsEmailVerified | BIT / `bool` | NOT NULL, DEFAULT 0 | Chuyển thành `true` khi `verify-email` thành công |
| LastLoginAt *(mới)* | DATETIME2 / `DateTime?` | NULL | Cập nhật khi đăng nhập thành công. Cập nhật bằng `ExecuteUpdateAsync` để không làm đổi `UpdatedAt` |
| FailedLoginCount *(mới)* | INT / `int` | NOT NULL, DEFAULT 0 | Đếm số lần sai mật khẩu liên tiếp, reset về 0 khi đăng nhập đúng |
| LockoutEnd *(mới)* | DATETIME2 / `DateTime?` | NULL | Khóa tạm thời tự động (ví dụ 15 phút sau 5 lần sai). Khác `IsActive` vì đây là khóa tự động, không phải Admin khóa |
| CreatedAt | DATETIME2 / `DateTime` | NOT NULL, DEFAULT `GETUTCDATE()` | Gán tự động trong `SaveChangesAsync` |
| CreatedBy *(mới)* | UNIQUEIDENTIFIER / `Guid?` | NULL, FK → Users(Id), NO ACTION | Thường là `NULL`: người dùng tự đăng ký và tài khoản Admin seed chưa có ai tạo. Chỉ có giá trị nếu sau này Admin tạo hộ tài khoản |
| UpdatedAt | DATETIME2 / `DateTime?` | NULL | Gán khi sửa hồ sơ, đổi trạng thái hoặc đổi mật khẩu |
| UpdatedBy *(mới)* | UNIQUEIDENTIFIER / `Guid?` | NULL, FK → Users(Id), NO ACTION | Người dùng tự sửa thì là chính họ, Admin khóa hoặc mở khóa thì là Id của Admin |
| DeletedAt *(mới)* | DATETIME2 / `DateTime?` | NULL | `NULL` nghĩa là chưa xóa. Đây là cờ xóa mềm, không cần thêm cột `IsDeleted` |
| DeletedBy *(mới)* | UNIQUEIDENTIFIER / `Guid?` | NULL, FK → Users(Id), NO ACTION | Id của người thực hiện xóa |

### 2.2 Phân biệt `IsActive`, `LockoutEnd`, `DeletedAt`

| Trạng thái | Cột | Ai đặt | Đăng nhập được? | Có thể khôi phục? |
|---|---|---|---|---|
| Bị Admin khóa | `IsActive = 0` | Admin qua `PUT /api/users/{id}/status` | Không | Có, Admin mở khóa |
| Khóa tạm do sai mật khẩu | `LockoutEnd > UtcNow` | Hệ thống | Không, đến khi hết hạn | Tự động hết hạn |
| Đã xóa | `DeletedAt IS NOT NULL` | Admin | Không, tài khoản coi như không tồn tại | Chỉ khôi phục bằng thao tác quản trị dữ liệu |

### 2.3 Quy tắc kiểm tra dữ liệu đầu vào (tầng DTO)

| Trường | Quy tắc |
|---|---|
| Username | Bắt buộc, 3–50 ký tự, regex `^[a-zA-Z0-9_.]{3,50}$`, không trùng trong nhóm chưa xóa |
| Email | Bắt buộc, định dạng email hợp lệ, tối đa 100 ký tự, không trùng trong nhóm chưa xóa |
| Password | Bắt buộc, tối thiểu 8 ký tự, có chữ hoa, chữ thường và số. **Chỉ kiểm tra ở DTO**, không kiểm tra ở CSDL vì DB chỉ lưu hash |
| FullName | Bắt buộc, 2–100 ký tự |
| Phone | Tùy chọn, đúng định dạng số điện thoại Việt Nam |
| Address | Tùy chọn, tối đa 255 ký tự |

### 2.4 Script tạo bảng

```sql
CREATE TABLE Users (
    Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Users PRIMARY KEY CONSTRAINT DF_Users_Id DEFAULT NEWID(),
    Username         NVARCHAR(50)  NOT NULL,
    Email            NVARCHAR(100) NOT NULL,
    PasswordHash     NVARCHAR(255) NOT NULL,
    FullName         NVARCHAR(100) NOT NULL,
    Phone            NVARCHAR(20)  NULL,
    Address          NVARCHAR(255) NULL,
    AvatarUrl        NVARCHAR(500) NULL,
    Role             NVARCHAR(20)  NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'User',
    IsActive         BIT           NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
    IsEmailVerified  BIT           NOT NULL CONSTRAINT DF_Users_IsEmailVerified DEFAULT 0,
    LastLoginAt      DATETIME2     NULL,
    FailedLoginCount INT           NOT NULL CONSTRAINT DF_Users_FailedLoginCount DEFAULT 0,
    LockoutEnd       DATETIME2     NULL,
    CreatedAt        DATETIME2     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT GETUTCDATE(),
    CreatedBy        UNIQUEIDENTIFIER NULL,
    UpdatedAt        DATETIME2     NULL,
    UpdatedBy        UNIQUEIDENTIFIER NULL,
    DeletedAt        DATETIME2     NULL,
    DeletedBy        UNIQUEIDENTIFIER NULL,

    CONSTRAINT CK_Users_Role CHECK (Role IN ('User','Seller','Admin')),
    CONSTRAINT FK_Users_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(Id),
    CONSTRAINT FK_Users_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES Users(Id),
    CONSTRAINT FK_Users_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES Users(Id)
);

-- Unique chỉ áp dụng cho tài khoản chưa xóa, để email/username của tài khoản đã xóa có thể đăng ký lại
CREATE UNIQUE INDEX UQ_Users_Email    ON Users(Email)    WHERE DeletedAt IS NULL;
CREATE UNIQUE INDEX UQ_Users_Username ON Users(Username) WHERE DeletedAt IS NULL;
```

> **Lưu ý:** không khai báo `UNIQUE` trực tiếp trên cột `Email` và `Username` như mục 2.3 của tài liệu gốc. Nếu khai báo, tài khoản đã xóa mềm vẫn chiếm email và username. Với cách trên, index `IX_Users_Email` ở mục 2.5 của tài liệu gốc cũng không còn cần thiết.

---

## 3. BẢNG REFRESHTOKENS

### 3.1 Danh sách cột

| Cột | Kiểu SQL / C# | Ràng buộc | Quy tắc & ghi chú |
|---|---|---|---|
| Id | UNIQUEIDENTIFIER / `Guid` | PK, DEFAULT `NEWID()` | UUID v4, sinh bằng `Guid.NewGuid()` |
| UserId | UNIQUEIDENTIFIER / `Guid` | FK → Users(Id), NOT NULL, ON DELETE CASCADE | Xóa mềm user không kích hoạt cascade, xem mục 7.4 |
| Token | NVARCHAR(500) / `string` | NOT NULL, UNIQUE | Sinh bằng `RandomNumberGenerator` 64 byte, mã hóa Base64Url (khoảng 86 ký tự). Không dùng `Guid` hay `Random`. Nên lưu **SHA-256 hash** (64 ký tự hex) thay vì token thô, để lộ DB cũng không dùng lại được, client giữ bản gốc |
| ExpiresAt | DATETIME2 / `DateTime` | NOT NULL | Đề xuất `UtcNow + 7 ngày` (tài liệu gốc chưa quy định) |
| IsRevoked | BIT / `bool` | NOT NULL, DEFAULT 0 | Đặt `true` khi logout, khi xoay vòng token, khi Admin khóa hoặc xóa tài khoản, khi đổi hoặc đặt lại mật khẩu |
| RevokedAt *(mới)* | DATETIME2 / `DateTime?` | NULL | Thời điểm thu hồi |
| ReplacedByTokenId *(mới)* | UNIQUEIDENTIFIER / `Guid?` | NULL, FK → RefreshTokens(Id), NO ACTION | Trỏ tới token mới thay thế khi xoay vòng. Nếu một token đã thu hồi mà bị dùng lại thì thu hồi toàn bộ token còn hiệu lực của user đó |
| CreatedByIp *(mới)* | NVARCHAR(45) / `string?` | NULL | IP lúc phát hành. 45 ký tự đủ cho IPv6 |
| CreatedAt | DATETIME2 / `DateTime` | NOT NULL, DEFAULT `GETUTCDATE()` | |

Trong model thêm thuộc tính tính toán (không ánh xạ vào CSDL):

```csharp
[NotMapped]
public bool IsValid => !IsRevoked && DateTime.UtcNow < ExpiresAt;
```

Đặt tên `IsValid` để không nhầm với `User.IsActive`.

### 3.2 Script tạo bảng

```sql
CREATE TABLE RefreshTokens (
    Id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RefreshTokens PRIMARY KEY CONSTRAINT DF_RefreshTokens_Id DEFAULT NEWID(),
    UserId            UNIQUEIDENTIFIER NOT NULL,
    Token             NVARCHAR(500) NOT NULL,
    ExpiresAt         DATETIME2     NOT NULL,
    IsRevoked         BIT           NOT NULL CONSTRAINT DF_RefreshTokens_IsRevoked DEFAULT 0,
    RevokedAt         DATETIME2     NULL,
    ReplacedByTokenId UNIQUEIDENTIFIER NULL,
    CreatedByIp       NVARCHAR(45)  NULL,
    CreatedAt         DATETIME2     NOT NULL CONSTRAINT DF_RefreshTokens_CreatedAt DEFAULT GETUTCDATE(),

    CONSTRAINT UQ_RefreshTokens_Token UNIQUE (Token),
    CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_RefreshTokens_ReplacedBy FOREIGN KEY (ReplacedByTokenId) REFERENCES RefreshTokens(Id)
);

CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
```

> **Lưu ý:** ràng buộc `UNIQUE` trên `Token` đã tự tạo index nên `IX_RefreshTokens_Token` ở mục 2.5 của tài liệu gốc là thừa. `IX_RefreshTokens_UserId` dùng cho thao tác thu hồi toàn bộ token của một user (khóa tài khoản, đổi mật khẩu, xóa tài khoản).

### 3.3 Cơ chế xoay vòng token

1. Client gửi refresh token cũ tới `POST /api/auth/refresh-token`.
2. Tìm token trong bảng. Không thấy thì trả 401.
3. Nếu token đã `IsRevoked = 1` mà có `ReplacedByTokenId` (bị dùng lại) thì thu hồi toàn bộ token còn hiệu lực của user, trả 401.
4. Kiểm tra `ExpiresAt`, `User.IsActive`, `User.DeletedAt`, `User.LockoutEnd`.
5. Tạo token mới. Gán token cũ: `IsRevoked = 1`, `RevokedAt = UtcNow`, `ReplacedByTokenId = <Id token mới>`.
6. Trả access token mới kèm refresh token mới.

---

## 4. BẢNG USERVERIFICATIONTOKENS

### 4.1 Danh sách cột

| Cột | Kiểu SQL / C# | Ràng buộc | Quy tắc & ghi chú |
|---|---|---|---|
| Id | UNIQUEIDENTIFIER / `Guid` | PK, DEFAULT `NEWID()` | UUID v4, sinh bằng `Guid.NewGuid()` |
| UserId | UNIQUEIDENTIFIER / `Guid` | FK → Users(Id), NOT NULL, ON DELETE CASCADE | |
| Token | NVARCHAR(255) / `string` | NOT NULL, UNIQUE | Sinh 32 byte ngẫu nhiên bằng `RandomNumberGenerator`, mã hóa Base64Url (43 ký tự, an toàn khi đặt trong link email) |
| Type | NVARCHAR(20) / `string` | NOT NULL, `CK_UserVerificationTokens_Type` | Chỉ nhận `EmailVerify` hoặc `PasswordReset`. Dùng hằng `VerificationTokenType` |
| ExpiresAt | DATETIME2 / `DateTime` | NOT NULL | `EmailVerify` = +24 giờ, `PasswordReset` = +1 giờ (theo mục 5.3 tài liệu gốc) |
| IsUsed | BIT / `bool` | NOT NULL, DEFAULT 0 | Đặt `true` sau khi dùng. Không xóa dòng để giữ lịch sử |
| UsedAt *(mới)* | DATETIME2 / `DateTime?` | NULL | Thời điểm token được dùng |
| CreatedAt | DATETIME2 / `DateTime` | NOT NULL, DEFAULT `GETUTCDATE()` | |

### 4.2 Script tạo bảng

```sql
CREATE TABLE UserVerificationTokens (
    Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_UserVerificationTokens PRIMARY KEY CONSTRAINT DF_UserVerificationTokens_Id DEFAULT NEWID(),
    UserId    UNIQUEIDENTIFIER NOT NULL,
    Token     NVARCHAR(255) NOT NULL,
    Type      NVARCHAR(20)  NOT NULL,
    ExpiresAt DATETIME2     NOT NULL,
    IsUsed    BIT           NOT NULL CONSTRAINT DF_UserVerificationTokens_IsUsed DEFAULT 0,
    UsedAt    DATETIME2     NULL,
    CreatedAt DATETIME2     NOT NULL CONSTRAINT DF_UserVerificationTokens_CreatedAt DEFAULT GETUTCDATE(),

    CONSTRAINT UQ_UserVerificationTokens_Token UNIQUE (Token),
    CONSTRAINT CK_UserVerificationTokens_Type CHECK (Type IN ('EmailVerify','PasswordReset')),
    CONSTRAINT FK_UserVerificationTokens_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX IX_UserVerificationTokens_UserId_Type ON UserVerificationTokens(UserId, Type);
```

### 4.3 Quy tắc sử dụng

- **Truy vấn token** luôn lọc đủ 4 điều kiện: `Token` + `Type` + `IsUsed = 0` + `ExpiresAt > UtcNow`. Thiếu `Type` có thể khiến token xác thực email bị dùng để đặt lại mật khẩu.
- **Phát hành token mới** cùng `Type` cho cùng user: đặt `IsUsed = 1` cho các token cũ chưa dùng, để mỗi thời điểm chỉ có một token còn hiệu lực.
- **`forgot-password`** luôn trả cùng một thông báo dù email có tồn tại hay không, để không lộ email nào đã đăng ký.
- **Đặt lại mật khẩu thành công**: đặt `IsUsed = 1`, cập nhật `PasswordHash`, thu hồi toàn bộ `RefreshTokens` của user.
- **Xác thực email thành công**: đặt `IsUsed = 1`, `UsedAt = UtcNow`, `User.IsEmailVerified = 1`.

---

## 5. CƠ CHẾ AUDIT VÀ XÓA MỀM

### 5.1 Vì sao làm tại `AppDbContext`

`AppDbContext` do Hoàng tạo và cả ba module dùng chung, nên làm một lần tại đây. Các entity khác của nhóm có thể kế thừa `AuditableEntity` sau này mà không phải viết lại.

### 5.2 Lớp cơ sở

```csharp
public abstract class AuditableEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}
```

### 5.3 Ghi audit tự động trong `SaveChangesAsync`

```csharp
public class AppDbContext : DbContext
{
    private readonly IHttpContextAccessor _http;

    public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor http)
        : base(options) => _http = http;

    private Guid? GetCurrentUserId()
    {
        var value = _http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id) ? id : (Guid?)null; // null khi chưa đăng nhập hoặc khi seed
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        var now = DateTime.UtcNow;

        foreach (var e in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (e.State)
            {
                case EntityState.Added:
                    e.Entity.CreatedAt = now;
                    e.Entity.CreatedBy = userId;
                    break;

                case EntityState.Modified:
                    e.Entity.UpdatedAt = now;
                    e.Entity.UpdatedBy = userId;
                    break;

                case EntityState.Deleted: // đổi xóa cứng thành xóa mềm
                    e.State = EntityState.Modified;
                    e.Entity.DeletedAt = now;
                    e.Entity.DeletedBy = userId;
                    break;
            }
        }
        return base.SaveChangesAsync(ct);
    }
}
```

Trong `Program.cs` cần thêm: `builder.Services.AddHttpContextAccessor();`

### 5.4 Những điểm cần lưu ý

| Vấn đề | Cách xử lý |
|---|---|
| `LastLoginAt` không được làm đổi `UpdatedAt` | Cập nhật bằng `ExecuteUpdateAsync`, không đi qua `SaveChangesAsync`: `await _db.Users.Where(u => u.Id == id).ExecuteUpdateAsync(s => s.SetProperty(u => u.LastLoginAt, now));` |
| `ON DELETE CASCADE` không chạy khi xóa mềm | Xóa mềm chỉ là `UPDATE`. Khi xóa user phải tự thu hồi `RefreshTokens` và vô hiệu hóa `UserVerificationTokens` (mục 7.4) |
| Truy vấn Admin cần xem cả user đã xóa | Dùng `.IgnoreQueryFilters()` cho truy vấn đó |
| Xóa mềm lệch giữa các module | Tài liệu gốc dùng `IsDeleted` ở `Products` (kèm index `WHERE IsDeleted = 0`), bảng `Users` dùng `DeletedAt`. Nên chốt một quy ước chung (mục 9) |
| Bảng giao dịch chỉ ghi thêm (`Bids`, `Payments`, `AuctionWinners`) | Không nên có xóa mềm. Nếu cần audit chỉ thêm `CreatedAt`, `CreatedBy` |

---

## 6. ENTITY C# VÀ CẤU HÌNH FLUENT API

### 6.1 Entity

```csharp
public static class Roles
{
    public const string User = "User";
    public const string Seller = "Seller";
    public const string Admin = "Admin";
}

public class User : AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid(); // UUID v4

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(255), JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]  public string? Phone { get; set; }
    [MaxLength(255)] public string? Address { get; set; }
    [MaxLength(500)] public string? AvatarUrl { get; set; }

    [Required, MaxLength(20)]
    public string Role { get; set; } = Roles.User;

    public bool IsActive { get; set; } = true;
    public bool IsEmailVerified { get; set; } = false;

    public DateTime? LastLoginAt { get; set; }
    public int FailedLoginCount { get; set; } = 0;
    public DateTime? LockoutEnd { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<UserVerificationToken> VerificationTokens { get; set; } = new List<UserVerificationToken>();
}

public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid(); // UUID v4
    public Guid UserId { get; set; }

    [Required, MaxLength(500)]
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; } = false;
    public DateTime? RevokedAt { get; set; }
    public Guid? ReplacedByTokenId { get; set; }

    [MaxLength(45)]
    public string? CreatedByIp { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public RefreshToken? ReplacedByToken { get; set; }

    [NotMapped]
    public bool IsValid => !IsRevoked && DateTime.UtcNow < ExpiresAt;
}

// UserVerificationToken: giữ nguyên như mục 5.3 tài liệu gốc, đổi và thêm:
//   public Guid Id { get; set; } = Guid.NewGuid();
//   public Guid UserId { get; set; }
//   public DateTime? UsedAt { get; set; }
```

### 6.2 Fluent API trong `OnModelCreating`

```csharp
modelBuilder.Entity<User>(e =>
{
    e.Property(u => u.Id).ValueGeneratedNever(); // Id do ứng dụng sinh bằng Guid.NewGuid()

    e.HasIndex(u => u.Email).IsUnique()
        .HasFilter("[DeletedAt] IS NULL").HasDatabaseName("UQ_Users_Email");
    e.HasIndex(u => u.Username).IsUnique()
        .HasFilter("[DeletedAt] IS NULL").HasDatabaseName("UQ_Users_Username");

    e.Property(u => u.Role).HasDefaultValue(Roles.User);
    e.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
    e.ToTable(t => t.HasCheckConstraint("CK_Users_Role", "[Role] IN ('User','Seller','Admin')"));

    // Tự tham chiếu cho các cột audit, không cascade
    e.HasOne<User>().WithMany().HasForeignKey(u => u.CreatedBy).OnDelete(DeleteBehavior.NoAction);
    e.HasOne<User>().WithMany().HasForeignKey(u => u.UpdatedBy).OnDelete(DeleteBehavior.NoAction);
    e.HasOne<User>().WithMany().HasForeignKey(u => u.DeletedBy).OnDelete(DeleteBehavior.NoAction);

    e.HasQueryFilter(u => u.DeletedAt == null);
});

modelBuilder.Entity<RefreshToken>(e =>
{
    e.Property(r => r.Id).ValueGeneratedNever();
    e.HasIndex(r => r.Token).IsUnique();
    e.HasIndex(r => r.UserId);
    e.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

    e.HasOne(r => r.User).WithMany(u => u.RefreshTokens)
        .HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
    e.HasOne(r => r.ReplacedByToken).WithMany()
        .HasForeignKey(r => r.ReplacedByTokenId).OnDelete(DeleteBehavior.NoAction);

    e.HasQueryFilter(r => r.User.DeletedAt == null); // khớp với filter của User
});

modelBuilder.Entity<UserVerificationToken>(e =>
{
    e.Property(t => t.Id).ValueGeneratedNever();
    e.HasIndex(t => t.Token).IsUnique();
    e.HasIndex(t => new { t.UserId, t.Type });
    e.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
    e.ToTable(t => t.HasCheckConstraint(
        "CK_UserVerificationTokens_Type", "[Type] IN ('EmailVerify','PasswordReset')"));

    e.HasOne(t => t.User).WithMany(u => u.VerificationTokens)
        .HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);

    e.HasQueryFilter(t => t.User.DeletedAt == null);
});
```

> **Thông báo cho Long và Hằng:** vì `User` có global query filter, các entity có quan hệ bắt buộc tới `User` (ví dụ `Product.Seller`, `Bid.Bidder`, `Notification.User`) sẽ bị EF cảnh báo và có thể trả `null` cho navigation nếu user đã xóa. Khi truy vấn lịch sử cần hiển thị cả người đã xóa thì dùng `.IgnoreQueryFilters()` hoặc chỉ lấy `UserId`.

---

## 7. QUY TRÌNH NGHIỆP VỤ LIÊN QUAN ĐẾN DỮ LIỆU

### 7.1 Đăng ký

1. Kiểm tra Username và Email chưa tồn tại trong nhóm chưa xóa.
2. Tạo `User`: `Role = 'User'`, `IsActive = 1`, `IsEmailVerified = 0`, `PasswordHash = BCrypt(password)`. `CreatedBy = NULL`.
3. Tạo `UserVerificationToken` loại `EmailVerify`, hạn 24 giờ.
4. `EmailService` ghi log link xác thực (mô phỏng gửi email).

### 7.2 Đăng nhập

Thứ tự kiểm tra:

1. Tìm user theo Username hoặc Email. Không thấy, hoặc đã xóa mềm, trả lỗi chung "Sai thông tin đăng nhập".
2. `IsActive = 0` thì từ chối (tài khoản bị khóa).
3. `LockoutEnd > UtcNow` thì từ chối (khóa tạm, cho biết thời điểm mở lại).
4. Kiểm tra mật khẩu:
   - Sai: `FailedLoginCount++`. Nếu đạt ngưỡng (ví dụ 5) thì `LockoutEnd = UtcNow + 15 phút`, `FailedLoginCount = 0`.
   - Đúng: `FailedLoginCount = 0`, `LockoutEnd = NULL`, `LastLoginAt = UtcNow`.
5. Nếu nhóm chốt bắt buộc xác thực email (mục 9) thì kiểm tra `IsEmailVerified = 1`.
6. Phát hành access token và refresh token mới, lưu `RefreshTokens`.

Thông báo lỗi ở bước 1 và bước 4 (sai mật khẩu) phải giống nhau để không lộ tài khoản nào tồn tại.

### 7.3 Khóa và mở khóa tài khoản

`PUT /api/users/{id}/status`:

- Đặt `IsActive`. `UpdatedAt` và `UpdatedBy` (Id của Admin) tự ghi.
- Khi khóa: thu hồi toàn bộ `RefreshTokens` của user (`IsRevoked = 1`, `RevokedAt = UtcNow`).
- Không cho Admin tự khóa chính mình.

### 7.4 Xóa mềm tài khoản (đề xuất, hiện chưa có endpoint trong mục 5.2)

Nếu bổ sung `DELETE /api/users/{id}` (chỉ Admin):

1. Kiểm tra user không còn phiên đấu giá `Active` với vai trò người bán và không có `AuctionWinners` ở trạng thái `Pending` (phối hợp với Long qua interface, không truy vấn trực tiếp bảng của module khác).
2. Thu hồi toàn bộ `RefreshTokens` của user.
3. Đặt `IsUsed = 1` cho các `UserVerificationTokens` chưa dùng.
4. Gọi `_db.Users.Remove(user)` rồi `SaveChangesAsync()`. Cơ chế ở mục 5.3 tự đổi thành xóa mềm và ghi `DeletedAt`, `DeletedBy`.
5. Không cho Admin tự xóa chính mình, không xóa tài khoản Admin cuối cùng.

### 7.5 Đổi và đặt lại mật khẩu

- Sau khi đổi hoặc đặt lại mật khẩu thành công: thu hồi toàn bộ `RefreshTokens` của user để buộc đăng nhập lại trên mọi thiết bị.
- Không bao giờ ghi mật khẩu gốc hoặc hash vào log.

### 7.6 Seed dữ liệu

Khởi tạo một tài khoản Admin mặc định: `Role = 'Admin'`, `IsActive = 1`, `IsEmailVerified = 1`, `CreatedBy = NULL`. Mật khẩu ban đầu đọc từ cấu hình (`appsettings` hoặc biến môi trường), không viết cứng trong mã nguồn.

---

## 8. ĐỐI CHIẾU THAY ĐỔI SO VỚI TÀI LIỆU GỐC

| Hạng mục | Tài liệu gốc | Thiết kế này | Lý do |
|---|---|---|---|
| Kiểu khóa chính và khóa ngoại | `INT IDENTITY` | `UNIQUEIDENTIFIER` (UUID v4, sinh ở ứng dụng) | Khó đoán, sinh trước khi lưu DB. Kéo theo đổi kiểu khóa ngoại ở module Long và Hằng |
| Users: cột đăng nhập | Không có | Thêm `LastLoginAt`, `FailedLoginCount`, `LockoutEnd` | Theo dõi đăng nhập và chống dò mật khẩu |
| Users: audit | Chỉ `CreatedAt`, `UpdatedAt` | Thêm `CreatedBy`, `UpdatedBy`, `DeletedAt`, `DeletedBy` | Biết ai tác động, hỗ trợ xóa mềm |
| Users: ràng buộc Role | Chỉ ghi chú | Thêm `CK_Users_Role` | Chặn giá trị Role ngoài danh sách |
| Users: unique Email, Username | `UNIQUE` thường | Filtered unique index `WHERE DeletedAt IS NULL` | Cho phép đăng ký lại sau khi xóa mềm |
| Users: index | `IX_Users_Email` | Bỏ | Unique index đã đảm nhiệm |
| RefreshTokens: cột | 6 cột | Thêm `RevokedAt`, `ReplacedByTokenId`, `CreatedByIp` | Hỗ trợ xoay vòng và phát hiện dùng lại token |
| RefreshTokens: index | `IX_RefreshTokens_Token` (filtered) | Bỏ, thêm `IX_RefreshTokens_UserId` | `UNIQUE` đã có index, cần index theo `UserId` để thu hồi hàng loạt |
| UserVerificationTokens: cột | 7 cột | Thêm `UsedAt` | Biết thời điểm dùng |
| UserVerificationTokens: ràng buộc Type | Chỉ ghi chú | Thêm `CK_UserVerificationTokens_Type` | Chặn giá trị Type ngoài danh sách |
| UserVerificationTokens: index | Không có | Thêm `IX_UserVerificationTokens_UserId_Type` | Tìm và vô hiệu hóa token cũ theo user và loại |
| Xóa user | `Products.SellerId` NO ACTION | Xóa mềm, không xóa cứng | Giữ lịch sử đấu giá và giao dịch |

---

## 9. CÁC ĐIỂM CẦN CHỐT VỚI NHÓM

| # | Vấn đề | Đề xuất | Ảnh hưởng |
|---|---|---|---|
| 1 | Cách một `User` trở thành `Seller` | Chọn một: tự nâng cấp khi đăng sản phẩm đầu tiên, Admin duyệt, hoặc mọi user đều đăng được. Nếu cần Admin duyệt thì bổ sung endpoint đổi Role | Long cần Seller để đăng sản phẩm. Tài liệu gốc có Role `Seller` nhưng chưa có API chuyển Role |
| 2 | Chưa xác thực email có được đăng nhập không | Cho đăng nhập nhưng chặn các thao tác nhạy cảm (đăng sản phẩm, đặt giá) cho đến khi xác thực | Cách dùng `IsEmailVerified` ở luồng đăng nhập |
| 3 | Thời hạn access token | `JwtHelper` (mục 5.4) đang đặt 24 giờ. Khi đã có refresh token nên rút xuống 15–60 phút, refresh token 7 ngày | Thời hạn `ExpiresAt` của `RefreshTokens` |
| 4 | Quy ước xóa mềm chung | Thống nhất dùng `DeletedAt` cho mọi bảng cần xóa mềm, hoặc `IsDeleted` cho mọi bảng. Không trộn hai kiểu | Lệch quy ước giữa `Users` và `Products` |
| 5 | Lưu refresh token thô hay hash | Lưu SHA-256 hash | Cách `AuthService` tìm token |
| 6 | Kiểu `Id` cho toàn dự án | `Users.Id` là UUID v4. Nên thống nhất **mọi bảng** dùng UUID v4 để khóa ngoại, route và DTO cùng kiểu. Nếu Long và Hằng giữ `INT` cho bảng của mình thì chỉ các cột trỏ vào `Users` bắt buộc là `Guid` | Model, DTO, route và migration của cả 3 module |
| 7 | Bổ sung `DELETE /api/users/{id}` | Có, chỉ Admin, theo quy trình mục 7.4 | Mục 5.2 tài liệu gốc chưa có endpoint xóa |

---

## 10. DANH SÁCH KIỂM TRA

**Cơ sở dữ liệu**

- [ ] Tạo migration `AddAuthTables` cho `Users`, `RefreshTokens`, `UserVerificationTokens`
- [ ] Filtered unique index cho `Email` và `Username`
- [ ] `CK_Users_Role` và `CK_UserVerificationTokens_Type`
- [ ] `IX_RefreshTokens_UserId`, `IX_UserVerificationTokens_UserId_Type`
- [ ] Thông báo cho nhóm trước khi chạy migration (chỉ một người tạo migration tại một thời điểm)

**Mã nguồn**

- [ ] Mọi `Id` gán `Guid.NewGuid()` và cấu hình `ValueGeneratedNever()`
- [ ] Route dùng `{id:guid}`, đọc claim `NameIdentifier` bằng `Guid.TryParse`
- [ ] `AuditableEntity` và cơ chế ghi audit trong `SaveChangesAsync`
- [ ] `AddHttpContextAccessor()` trong `Program.cs`
- [ ] Global query filter cho `User`, `RefreshToken`, `UserVerificationToken`
- [ ] `PasswordHash` có `[JsonIgnore]`, không xuất hiện trong bất kỳ DTO response nào
- [ ] `LastLoginAt` cập nhật bằng `ExecuteUpdateAsync`
- [ ] Seed tài khoản Admin mặc định, mật khẩu đọc từ cấu hình

**Nghiệp vụ**

- [ ] Xoay vòng refresh token và phát hiện dùng lại token đã thu hồi
- [ ] Truy vấn verification token luôn kèm `Type`, `IsUsed = 0`, `ExpiresAt > UtcNow`
- [ ] `forgot-password` trả cùng thông báo dù email có tồn tại hay không
- [ ] Khóa, xóa tài khoản hoặc đổi mật khẩu thì thu hồi toàn bộ refresh token
- [ ] Thông báo lỗi đăng nhập không phân biệt sai tên đăng nhập và sai mật khẩu

**Phối hợp**

- [ ] Công bố kiểu `Id` (`Guid`, UUID v4) và tên bảng `Users` cho Long và Hằng trong tuần 1, kèm danh sách khóa ngoại phải đổi kiểu (mục 1.4)
- [ ] Thông báo về global query filter của `User` cho Long và Hằng
- [ ] Chốt các điểm ở mục 9 trước khi bắt đầu tuần 2
