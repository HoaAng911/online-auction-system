# TỔNG KẾT FEATURE PHỤ — HOÀNG HỖ TRỢ PAYMENT (MODULE HẰNG)

> Ghi chú: Đây là feature phụ do **Hoàng** làm hỗ trợ khi **Hằng** chưa làm được phần Thanh toán / Thông báo / Đánh giá.
> Người thực hiện: **Hoàng** — Branch: `feature/hoang-support-payment`.
> Phạm vi gốc thuộc Module 3 của Hằng theo [`TAI-LIEU-KY-THUAT-BACKEND.md`](TAI-LIEU-KY-THUAT-BACKEND.md:738) mục 7.

**Trạng thái:** Đã hoàn thành backend, build 0 lỗi 0 warning, migration `AddModule3HangTables` đã tạo.

---

## 1. Bảng dữ liệu phụ trách

| Bảng                             | File Model                                                             | File Configuration                                                                                                         | Ghi chú                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Payments`                       | [`backend/Models/Payment.cs`](backend/Models/Payment.cs:1)             | [`backend/Data/Configurations/PaymentConfiguration.cs`](backend/Data/Configurations/PaymentConfiguration.cs:1)             | FK 1-1 tới `AuctionWinners`, CK Amount > 0, CK Status, CK Method                                            |
| `Notifications`                  | [`backend/Models/Notification.cs`](backend/Models/Notification.cs:1)   | [`backend/Data/Configurations/NotificationConfiguration.cs`](backend/Data/Configurations/NotificationConfiguration.cs:1)   | FK CASCADE tới `Users`, index `(UserId, IsRead)`                                                            |
| `Reviews`                        | [`backend/Models/Review.cs`](backend/Models/Review.cs:1)               | [`backend/Data/Configurations/ReviewConfiguration.cs`](backend/Data/Configurations/ReviewConfiguration.cs:1)               | UNIQUE `(ProductId, ReviewerId)`, CK Rating 1–5, kế thừa `AuditableEntity` (xóa mềm)                        |
| `Settings`                       | [`backend/Models/Setting.cs`](backend/Models/Setting.cs:1)             | [`backend/Data/Configurations/SettingConfiguration.cs`](backend/Data/Configurations/SettingConfiguration.cs:1)             | UNIQUE `Key`, seed mặc định `CommissionRate=5`, `MinBidAmount=10000`                                        |
| `AuctionWinners` (bản tối thiểu) | [`backend/Models/AuctionWinner.cs`](backend/Models/AuctionWinner.cs:1) | [`backend/Data/Configurations/AuctionWinnerConfiguration.cs`](backend/Data/Configurations/AuctionWinnerConfiguration.cs:1) | Thuộc Module Long nhưng tạo trước để `Payment` có FK hợp lệ; Long mở rộng thêm FK tới `Products`/`Bids` sau |

DbSets đã đăng ký trong [`backend/Data/AppDbContext.cs`](backend/Data/AppDbContext.cs:31). Id dùng `Guid` đồng nhất với `Users` (thay vì `INT` trong tài liệu gốc).

---

## 2. API đã triển khai

### Thanh toán — [`backend/Controllers/PaymentController.cs`](backend/Controllers/PaymentController.cs:1)

| Phương thức | Endpoint                                   | Quyền       | Mô tả                                                                                                                                   |
| ----------- | ------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| POST        | `/api/payments/{auctionWinnerId}/mock-pay` | Đã xác thực | Mô phỏng thanh toán. Chỉ người thắng được trả, kiểm tra `PaymentMethod` thuộc VNPay/Momo/COD/BankTransfer, chống thanh toán trùng (409) |
| GET         | `/api/payments/my`                         | Đã xác thực | Lịch sử thanh toán của bản thân, phân trang                                                                                             |

### Thông báo — [`backend/Controllers/NotificationController.cs`](backend/Controllers/NotificationController.cs:1)

| Phương thức | Endpoint                          | Quyền       | Mô tả                                                     |
| ----------- | --------------------------------- | ----------- | --------------------------------------------------------- |
| GET         | `/api/notifications`              | Đã xác thực | Danh sách thông báo của bản thân, phân trang              |
| GET         | `/api/notifications/unread-count` | Đã xác thực | Số thông báo chưa đọc                                     |
| PUT         | `/api/notifications/{id}/read`    | Đã xác thực | Đánh dấu đã đọc (kiểm tra chủ sở hữu, 403 nếu không phải) |
| PUT         | `/api/notifications/read-all`     | Đã xác thực | Đánh dấu tất cả đã đọc (mở rộng ngoài tài liệu gốc)       |

### Đánh giá — [`backend/Controllers/ReviewController.cs`](backend/Controllers/ReviewController.cs:1)

| Phương thức | Endpoint                           | Quyền       | Mô tả                                                                                     |
| ----------- | ---------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| POST        | `/api/reviews`                     | Đã xác thực | Gửi đánh giá. Chỉ người thắng được đánh giá (403), mỗi sản phẩm một lần (409), Rating 1–5 |
| GET         | `/api/reviews/product/{productId}` | Công khai   | Danh sách đánh giá của sản phẩm, kèm tên người đánh giá                                   |

### Cấu hình — [`backend/Controllers/SettingController.cs`](backend/Controllers/SettingController.cs:1)

| Phương thức | Endpoint              | Quyền | Mô tả                           |
| ----------- | --------------------- | ----- | ------------------------------- |
| GET         | `/api/settings`       | Admin | Xem toàn bộ cấu hình            |
| GET         | `/api/settings/{key}` | Admin | Xem một cấu hình theo key       |
| PUT         | `/api/settings/{key}` | Admin | Cập nhật cấu hình theo key      |
| POST        | `/api/settings`       | Admin | Thêm mới hoặc cập nhật (upsert) |

### Thống kê — [`backend/Controllers/AdminController.cs`](backend/Controllers/AdminController.cs:1)

| Phương thức | Endpoint               | Quyền | Mô tả                                                                                                                |
| ----------- | ---------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| GET         | `/api/admin/dashboard` | Admin | Tổng hợp: tổng users, phiên thắng, payments, doanh thu, reviews, rating trung bình, payments chờ, thông báo chưa đọc |

---

## 3. Services

| Interface                                                                                | Triển khai                                                                             | Chức năng chính                                                                                                                  |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [`backend/Services/INotificationService.cs`](backend/Services/INotificationService.cs:1) | [`backend/Services/NotificationService.cs`](backend/Services/NotificationService.cs:1) | `CreateAsync` dùng chung cho cả 3 module (Hoàng, Long gọi khi khóa tài khoản / vượt giá / thắng đấu giá); CRUD thông báo cá nhân |
| [`backend/Services/IPaymentService.cs`](backend/Services/IPaymentService.cs:1)           | [`backend/Services/PaymentService.cs`](backend/Services/PaymentService.cs:1)           | `MockPayAsync` + lịch sử cá nhân; cho phép thử lại nếu payment cũ Failed                                                         |
| [`backend/Services/IReviewService.cs`](backend/Services/IReviewService.cs:1)             | [`backend/Services/ReviewService.cs`](backend/Services/ReviewService.cs:1)             | Ràng buộc người thắng + một lần duy nhất                                                                                         |
| [`backend/Services/ISettingService.cs`](backend/Services/ISettingService.cs:1)           | [`backend/Services/SettingService.cs`](backend/Services/SettingService.cs:1)           | GetAll / GetByKey / Upsert / UpdateByKey                                                                                         |
| [`backend/Services/IDashboardService.cs`](backend/Services/IDashboardService.cs:1)       | [`backend/Services/DashboardService.cs`](backend/Services/DashboardService.cs:1)       | Tổng hợp số liệu, không cần bảng mới                                                                                             |

DI đã đăng ký trong [`backend/Program.cs`](backend/Program.cs:49), seed Settings mặc định cùng block seed Admin.

---

## 4. DTOs

- [`backend/DTOs/Payment/PaymentDto.cs`](backend/DTOs/Payment/PaymentDto.cs:1) — `PaymentDto`, `MockPayDto`
- [`backend/DTOs/Notification/NotificationDto.cs`](backend/DTOs/Notification/NotificationDto.cs:1) — `NotificationDto`
- [`backend/DTOs/Review/ReviewDto.cs`](backend/DTOs/Review/ReviewDto.cs:1) — `ReviewDto`, `CreateReviewDto`
- [`backend/DTOs/Setting/SettingDto.cs`](backend/DTOs/Setting/SettingDto.cs:1) — `SettingDto`, `UpdateSettingDto`, `UpsertSettingDto`
- [`backend/DTOs/Admin/DashboardDto.cs`](backend/DTOs/Admin/DashboardDto.cs:1) — `DashboardDto`

---

## 5. Điểm phối hợp với Hằng và Long

- `INotificationService.CreateAsync(Guid, string, string, string, string?, Guid?)` đã ổn định — Hằng/Long chỉ cần inject và gọi, không cần đợi thêm.
- Long tạo `AuctionWinner` xong thì khởi tạo `Payment` tương ứng: hiện `PaymentService` đọc trực tiếp `AuctionWinners` (Status = Pending chưa có `Payment`); khi Long cung cấp interface riêng sẽ chuyển sang dùng interface đó theo mục 8 tài liệu gốc.
- `Review.ProductId` hiện là Guid tự do chưa FK vật lý; khi Long tạo bảng `Products` sẽ bổ sung FK + navigation.
- `AuctionWinnerConfiguration` là bản tối thiểu do Hoàng tạo tạm; Long mở rộng thêm FK tới `Products`/`Bids` khi làm Module 2. Hằng tiếp quản lại module khi quay lại.

---

## 6. Tiêu chí hoàn thành (mục 10 tài liệu gốc)

- [x] Build 0 lỗi, 0 warning
- [x] Validate đầu vào đầy đủ (DataAnnotations + kiểm tra nghiệp vụ trong service)
- [x] Phản hồi đúng cấu trúc `ApiResponse<T>` camelCase
- [x] Không lộ thông tin nhạy cảm
- [ ] Kiểm thử thủ công các endpoint (cần DB đang chạy + `dotnet ef database update`)
- [ ] Tạo Pull Request, nhờ 1 thành viên review trước khi merge
