# CẤU TRÚC DỰ ÁN — HỆ THỐNG ĐẤU GIÁ TRỰC TUYẾN

**Mô tả:** Tài liệu mô tả cấu trúc thư mục, chức năng từng phần chính và ánh xạ
với thiết kế module đã được thống nhất trong nhóm.

**Công nghệ chính:**
- Backend: ASP.NET Core Web API (.NET 8), Entity Framework Core, SQL Server
- Frontend: React + Vite, Tailwind CSS
- Kiến trúc: monorepo gồm `backend/` và `frontend/`

---

## 1. TỔNG QUAN CẤU TRÚC

```
online-auction-system/
├── backend/                  # API + xử lý nghiệp vụ + CSDL
├── frontend/                 # Giao diện người dùng
├── tools/                    # Công cụ kiểm tra model/schema
├── TAI-LIEU-KY-THUAT-BACKEND.md
├── THIET-KE-BANG-MODULE-HOANG.md
├── TONG-KET-FEATURE-HANG.md
├── DANH-GIA-CAU-TRUC.md
├── GITHUB-WORKFLOW-RULES.md
└── OnlineAuctionSystem.slnx  # Solution tổng (nếu cần mở cả 2 project cùng lúc)
```

---

## 2. BACKEND (`backend/`)

### 2.1 Mục tiêu
- Cung cấp REST API cho frontend.
- Quản lý xác thực, phân quyền, dữ liệu người dùng.
- Lưu trữ và truy vấn dữ liệu đấu giá, thanh toán, thông báo, đánh giá.

### 2.2 Cấu trúc thư mục

| Đường dẫn                   | Vai trò                                                                     |
| --------------------------- | --------------------------------------------------------------------------- |
| `backend/Program.cs`        | Đăng ký dịch vụ, middleware, kết nối DB, JWT, SignalR…                      |
| `backend/backend.csproj`    | Khai báo package, target framework (.NET 8).                                |
| `backend/appsettings*.json` | Cấu hình môi trường: connection string, JWT, email…                         |
| `backend/Controllers/`      | Định nghĩa endpoint API theo từng nhóm nghiệp vụ.                           |
| `backend/Models/`           | Entity EF Core: ánh xạ bảng CSDL.                                           |
| `backend/DTOs/`             | Đối tượng truyền/nhận dữ liệu giữa API và client.                           |
| `backend/Data/`             | `AppDbContext` + các cấu hình Fluent API cho entity.                        |
| `backend/Helpers/`          | Tiện ích dùng chung: `JwtHelper`, `PasswordHelper`, `TokenGeneratorHelper`. |
| `backend/Services/`         | Xử lý nghiệp vụ tầng application (`I*Service` + impl).                      |
| `backend/Repositories/`     | (nếu có) Tầng truy cập dữ liệu chung.                                       |
| `backend/Middlewares/`      | Middleware xử lý lỗi tập trung.                                             |
| `backend/Hubs/`             | (nếu có) SignalR hub cho thông báo thời gian thực.                          |
| `backend/Migrations/`       | Migration EF Core theo lịch sử thay đổi schema.                             |
| `backend/Properties/`       | Cấu hình launch/profile cho local debug.                                    |

### 2.3 Luồng chính
1. Request vào `Controllers/` → validate DTO.
2. Gọi `Services/` để xử lý nghiệp vụ.
3. `Services/` dùng `AppDbContext` để đọc/ghi `Models/`.
4. Trả về DTO cho frontend.

### 2.4 Liên kết với tài liệu thiết kế
- Thiết kế bảng chi tiết: `THIET-KE-BANG-MODULE-HOANG.md`
- Tài liệu kỹ thuật tổng: `TAI-LIEU-KY-THUAT-BACKEND.md`
- Tổng kết feature: `TONG-KET-FEATURE-HANG.md`

---

## 3. FRONTEND (`frontend/`)

### 3.1 Mục tiêu
- Giao diện người dùng cuối: đăng nhập, đăng ký, xem phiên, đặt giá, quản lý hồ sơ.
- Giao diện quản trị: dashboard, người dùng, cài đặt.

### 3.2 Cấu trúc thư mục

| Đường dẫn                  | Vai trò                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `frontend/index.html`      | HTML gốc, mount điểm ứng dụng React.                                 |
| `frontend/package.json`    | Dependencies, scripts (`dev`, `build`, `preview`).                   |
| `frontend/vite.config.js`  | Cấu hình Vite: alias, dev server, build.                             |
| `frontend/src/main.jsx`    | Mount React app vào DOM.                                             |
| `frontend/src/App.jsx`     | Router tổng, layout chính.                                           |
| `frontend/src/index.css`   | Design system: biến màu, typography, button, spacing.                |
| `frontend/src/pages/`      | Trang theo route: `Home`, `Auth`, `Profile`, `AdminDashboard`…       |
| `frontend/src/components/` | Component dùng chung: `Navbar`, `Footer`, `Layout`, `ReviewSection`… |
| `frontend/src/routes/`     | Cấu hình route, `ProtectedRoute` cho trang cần đăng nhập.            |
| `frontend/src/context/`    | React Context: `AuthContext` quản lý trạng thái đăng nhập.           |
| `frontend/src/services/`   | Gọi API backend: `api.js`, `authService.js`, `userService.js`…       |
| `frontend/src/utils/`      | Tiện ích nhỏ: `scrollReveal.js`.                                     |
| `frontend/src/assets/`     | Hình ảnh tĩnh: logo, hero, icon.                                     |
| `frontend/public/`         | File public phục vụ trực tiếp: favicon, icons.                       |

### 3.3 Luồng chính
1. Người dùng truy cập route → `pages/` render nội dung.
2. Gọi API qua `services/` để lấy/cập nhật dữ liệu.
3. Dùng `context/` để chia sẻ trạng thái toàn app (ví dụ: `isAuthenticated`).
4. Style theo design system tập trung ở `index.css`.

---

## 4. TOOLS (`tools/`)

### 4.1 Mục tiêu
- Hỗ trợ kiểm tra model, schema, quy tắc dữ liệu trong quá trình phát triển.

### 4.2 Cấu trúc
- `tools/ModelCheck/`: công cụ kiểm tra model backend.

---

## 5. TÀI LIỆU GỐC

| File                            | Nội dung chính                                                       |
| ------------------------------- | -------------------------------------------------------------------- |
| `TAI-LIEU-KY-THUAT-BACKEND.md`  | Tài liệu kỹ thuật tổng backend: API, bảo mật, CSDL, nghiệp vụ chung. |
| `THIET-KE-BANG-MODULE-HOANG.md` | Thiết kế chi tiết bảng dữ liệu Module 1: xác thực & người dùng.      |
| `TONG-KET-FEATURE-HANG.md`      | Tổng kết các feature/module của hệ thống.                            |
| `DANH-GIA-CAU-TRUC.md`          | Đánh giá cấu trúc dự án, điểm mạnh/yếu, đề xuất cải tiến.            |
| `GITHUB-WORKFLOW-RULES.md`      | Quy tắc nhánh/commit/workflow trên GitHub.                           |

---

## 6. PHÂN CHIA MODULE THEO NHÓM

Dựa vào `THIET-KE-BANG-MODULE-HOANG.md` và cấu trúc hiện có:

| Module                                      | Người phụ trách | Phạm vi chính trong code                                                                                                             |
| ------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Module 1: Xác thực & Người dùng             | Hoàng           | `backend/Models/User.cs`, `RefreshToken.cs`, `UserVerificationToken.cs`, `AuthController.cs`, `UserController.cs`, `AppDbContext.cs` |
| Module 2: Sản phẩm & Đấu giá                | Long            | `Products`, `Bids`, `AuctionWinners`…                                                                                                |
| Module 3: Thanh toán & Thông báo & Đánh giá | Hằng            | `Payments`, `Notifications`, `Reviews`, `Settings`…                                                                                  |

> Lưu ý: frontend hiện đang dùng chung cho cả 3 module, chia theo `pages/` và `services/`.

---

## 7. QUY ƯỚC CHÍNH

- **Ngôn ngữ:** backend C#, frontend JavaScript/JSX.
- **Cấu trúc route:** `/api/...` cho backend, React Router cho frontend.
- **Xác thực:** JWT + refresh token.
- **CSDL:** SQL Server, EF Core Code First + Migration.
- **Style:** Tailwind CSS + custom design system trong `frontend/src/index.css`.
