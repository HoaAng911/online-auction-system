# QUY TẮC LÀM VIỆC VỚI GITHUB
## Dự án: Online Auction System — Nhóm 3 thành viên

> Đọc kỹ file này trước khi bắt đầu code. Mục tiêu: không ai đè code của ai, không ai bị mất công sửa conflict lằng nhằng.

---

## MỤC LỤC

1. [Thiết lập ban đầu](#1-thiết-lập-ban-đầu)
2. [Cấu hình Git cá nhân](#2-cấu-hình-git-cá-nhân)
3. [Quy tắc đặt tên branch](#3-quy-tắc-đặt-tên-branch)
4. [Quy trình làm việc hàng ngày](#4-quy-trình-làm-việc-hàng-ngày)
5. [Quy ước commit message](#5-quy-ước-commit-message)
6. [Quy tắc Pull Request](#6-quy-tắc-pull-request)
7. [Xử lý Conflict](#7-xử-lý-conflict)
8. [File dùng chung — cẩn thận khi sửa](#8-file-dùng-chung--cẩn-thận-khi-sửa)
9. [Quy tắc riêng cho Migration (EF Core)](#9-quy-tắc-riêng-cho-migration-ef-core)
10. [Những điều TUYỆT ĐỐI không làm](#10-những-điều-tuyệt-đối-không-làm)
11. [Checklist trước khi push](#11-checklist-trước-khi-push)
12. [Lệnh Git tra cứu nhanh](#12-lệnh-git-tra-cứu-nhanh)

---

## 1. THIẾT LẬP BAN ĐẦU

### 1.1 Người tạo repo (làm 1 lần duy nhất)

```bash
git init
git add .
git commit -m "chore: init project structure"
git remote add origin https://github.com/<username>/online-auction-system.git
git branch -M main
git push -u origin main
```

Sau đó vào GitHub:
**Settings → Collaborators → Add people** → nhập username/email của 2 thành viên còn lại → họ nhận lời mời qua email → bấm **Accept invitation**.

### 1.2 Hai thành viên còn lại — clone project về máy

```bash
git clone https://github.com/<username>/online-auction-system.git
cd online-auction-system
```

Sau khi clone, mỗi người tự cài lại dependency (không nằm trong Git):

```bash
# Backend
cd backend
dotnet restore

# Frontend
cd ../frontend
npm install
```

---

## 2. CẤU HÌNH GIT CÁ NHÂN

Mỗi máy chỉ cần làm 1 lần:

```bash
git config --global user.name "Tên thật của bạn"
git config --global user.email "email-dang-ky-github@example.com"
```

> Quan trọng: dùng đúng tên thật hoặc tên dễ nhận biết — để khi xem lịch sử commit, cả nhóm biết ai đã code phần nào (phục vụ cả việc chấm điểm cá nhân nếu giảng viên yêu cầu).

Kiểm tra đã cấu hình đúng chưa:
```bash
git config --global user.name
git config --global user.email
```

---

## 3. QUY TẮC ĐẶT TÊN BRANCH

### 3.1 Cấu trúc chung

```
feature/<module>-<mô-tả-ngắn>
fix/<module>-<mô-tả-lỗi>
```

### 3.2 Phân bổ theo người phụ trách

| Người | Prefix branch |
|---|---|
| Người 1 (Auth & User) | `feature/auth-...` |
| Người 2 (Product & Category) | `feature/product-...` |
| Người 3 (Bidding & Real-time) | `feature/bid-...` |

### 3.3 Ví dụ cụ thể

```
feature/auth-register
feature/auth-login
feature/auth-jwt-config
feature/product-crud
feature/product-upload-image
feature/product-search-filter
feature/bid-place-bid
feature/bid-signalr-hub
feature/bid-auto-close
fix/product-filter-null-category
fix/bid-concurrency-error
```

**Không đặt tên chung chung** như `feature/update`, `feature/fix-bug`, `abc`, `test123` — không ai biết branch đó làm gì khi nhìn danh sách.

---

## 4. QUY TRÌNH LÀM VIỆC HÀNG NGÀY

Làm đúng theo thứ tự này mỗi khi bắt đầu 1 công việc mới:

### Bước 1 — Luôn cập nhật `main` mới nhất trước khi code

```bash
git checkout main
git pull origin main
```

> Bỏ qua bước này là nguyên nhân số 1 gây conflict — vì bạn đang code trên code cũ trong khi đồng đội đã cập nhật `main`.

### Bước 2 — Tạo branch mới từ `main`

```bash
git checkout -b feature/auth-login
```

### Bước 3 — Code, rồi commit theo từng phần nhỏ, đừng gom hết vào 1 commit khổng lồ

```bash
git add .
git commit -m "feat(auth): add login API with JWT token generation"
```

### Bước 4 — Đẩy branch lên GitHub

```bash
git push origin feature/auth-login
```
(Lần đầu push branch mới có thể cần `-u`: `git push -u origin feature/auth-login`)

### Bước 5 — Tạo Pull Request (PR) trên GitHub

- Vào tab **Pull requests → New pull request**
- **base: `main`** ← **compare: `feature/auth-login`**
- Viết mô tả: đã làm gì, cách test, có ảnh hưởng file dùng chung không
- Gắn thẻ 1 thành viên khác vào mục **Reviewers**

### Bước 6 — Chờ review, sửa nếu có góp ý

Nếu người review yêu cầu sửa, cứ commit tiếp trên cùng branch đó và push lại — PR sẽ tự cập nhật, không cần tạo PR mới.

### Bước 7 — Merge sau khi được Approve

Bấm **Merge pull request** trên GitHub (ưu tiên **Squash and merge** để lịch sử `main` gọn gàng, mỗi PR gộp thành 1 commit).

### Bước 8 — Dọn dẹp sau khi merge

```bash
git checkout main
git pull origin main
git branch -d feature/auth-login
```
Trên GitHub, tick **Delete branch** ngay sau khi merge xong (nút hiện ra tự động).

---

## 5. QUY ƯỚC COMMIT MESSAGE

### 5.1 Cấu trúc

```
<type>(<module>): <mô tả ngắn gọn, thì hiện tại>
```

### 5.2 Danh sách `type` dùng thống nhất

| Type | Khi nào dùng |
|---|---|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa lỗi |
| `refactor` | Tái cấu trúc code, không đổi hành vi bên ngoài |
| `docs` | Cập nhật tài liệu (README, file .md) |
| `chore` | Cập nhật cấu hình, package, việc lặt vặt không phải code nghiệp vụ |
| `test` | Thêm/sửa test |
| `style` | Format code, đổi tên biến, không ảnh hưởng logic |

### 5.3 Ví dụ tốt

```
feat(auth): implement register API with duplicate email check
fix(product): fix filter returning empty when categoryId is null
refactor(bid): extract concurrency check into separate method
docs: update API spec for reject product endpoint
chore: add BCrypt.Net-Next package
```

### 5.4 Ví dụ KHÔNG nên viết

```
update
fix bug
asdasd
commit cuối
sửa lại
```
→ Không ai biết đã sửa gì khi xem lại lịch sử sau vài tuần.

---

## 6. QUY TẮC PULL REQUEST

- [ ] PR chỉ nên gói gọn **1 tính năng/module nhỏ** — không gộp 5-6 việc khác nhau vào 1 PR (khó review, khó revert nếu có lỗi)
- [ ] Tiêu đề PR rõ ràng, giống commit message chính: `feat(auth): login API`
- [ ] Mô tả PR nên có: đã test gì, có đổi file dùng chung (`Program.cs`, `AppDbContext.cs`) không
- [ ] **Không tự merge PR của chính mình** nếu còn thành viên khác rảnh để review — trừ trường hợp gấp deadline và đã báo trước trong nhóm chat
- [ ] Review PR của đồng đội trong vòng 24h để không chặn tiến độ người khác
- [ ] Nếu phát hiện lỗi khi review, comment trực tiếp vào dòng code đó trên GitHub thay vì chỉ nhắn qua Zalo/Messenger — để lưu lại lịch sử trao đổi ngay trong PR

---

## 7. XỬ LÝ CONFLICT

### 7.1 Trường hợp hay gặp nhất — conflict khi `pull`

```bash
git checkout main
git pull origin main
```
```
Auto-merging backend/Program.cs
CONFLICT (content): Merge conflict in backend/Program.cs
Automatic merge failed; fix conflicts and then commit the result.
```

### 7.2 Cách xử lý

Mở file bị conflict, sẽ thấy dạng:

```csharp
<<<<<<< HEAD
builder.Services.AddScoped<IAuthService, AuthService>();
=======
builder.Services.AddScoped<IProductService, ProductService>();
>>>>>>> feature/product-crud
```

**Đọc kỹ cả 2 phần** — thường không phải lỗi thật, mà là 2 người cùng thêm dòng khác nhau vào cùng 1 vị trí file. Giữ lại **cả 2 dòng cần thiết**, xóa hết các ký hiệu `<<<<<<<`, `=======`, `>>>>>>>`:

```csharp
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
```

Sau đó:
```bash
git add .
git commit -m "fix: resolve merge conflict in Program.cs"
git push origin feature/xxx
```

### 7.3 Khi không chắc chắn cách giải quyết

**Không tự đoán rồi push bừa** — nhắn ngay trong nhóm hỏi người kia đã thêm đoạn đó để làm gì, tránh xóa nhầm code của nhau.

### 7.4 Conflict trong file Migration (EF Core) — xem thêm mục 9

Không sửa tay file migration khi conflict — luôn xóa và tạo lại.

---

## 8. FILE DÙNG CHUNG — CẨN THẬN KHI SỬA

Các file sau **nhiều người cùng đụng vào**, dễ conflict nhất — trước khi sửa, nên báo trong nhóm chat:

| File | Lý do dễ conflict | Cách hạn chế |
|---|---|---|
| `Program.cs` | Cả 3 người đều thêm `AddScoped`, cấu hình middleware | Mỗi lần chỉ thêm đúng phần của mình, pull mới nhất trước khi sửa |
| `Data/AppDbContext.cs` | Cả 3 người đều thêm `DbSet<T>` | Thêm dòng mới ở cuối, không sắp xếp lại thứ tự các dòng cũ |
| `backend.csproj` | Cài package mới tự động sửa file này | Ít khi conflict nặng, nhưng vẫn nên pull trước khi cài package mới |
| `.gitignore` | Hiếm khi sửa, nhưng nếu sửa cần cả nhóm biết | Thống nhất 1 lần từ đầu dự án, hạn chế sửa lại |

**Nguyên tắc chung**: khi cần sửa 1 trong các file trên, hãy **pull mới nhất → sửa → commit → push → tạo PR ngay**, đừng giữ thay đổi trong máy lâu vì càng để lâu càng dễ conflict với người khác.

---

## 9. QUY TẮC RIÊNG CHO MIGRATION (EF CORE)

Đây là phần **dễ gây lỗi khó sửa nhất** nếu làm ẩu — migration là các file code tự sinh, mô tả sự thay đổi của database theo đúng thứ tự thời gian.

### 9.1 Quy tắc bắt buộc

- [ ] **Chỉ 1 người tạo migration tại 1 thời điểm** — báo trong nhóm chat trước: *"Mình sắp tạo migration thêm bảng Product nhé"*
- [ ] Luôn `git pull` lấy migration mới nhất của người khác **trước khi** tạo migration của mình
- [ ] Đặt tên migration rõ ràng, mô tả đúng thay đổi:
```bash
dotnet ef migrations add AddProductTable
dotnet ef migrations add AddRowVersionToProduct
dotnet ef migrations add AddNotificationTable
```
Không đặt tên như `Migration1`, `test`, `update123`

### 9.2 Khi bị conflict ở thư mục `Migrations/`

**KHÔNG bao giờ sửa tay** file trong `Migrations/` để giải quyết conflict — dễ làm hỏng cấu trúc database. Thay vào đó:

```bash
# Xóa migration của mình (migration CHƯA chạy dotnet ef database update trên máy người khác)
dotnet ef migrations remove

# Pull lại migration mới nhất từ main
git pull origin main

# Tạo lại migration của mình trên nền code mới nhất
dotnet ef migrations add <TenMigration>
dotnet ef database update
```

### 9.3 Khi đổi máy hoặc pull code có migration mới

```bash
git pull origin main
dotnet ef database update
```
Luôn chạy `dotnet ef database update` sau khi pull nếu thấy có file mới trong `Migrations/` — nếu không, database local sẽ không khớp với code, gây lỗi khi chạy app.

---

## 10. NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG LÀM

- ❌ **Không** `git push --force` lên `main` — có thể xóa mất commit của người khác vĩnh viễn
- ❌ **Không** commit trực tiếp lên `main` — luôn qua branch riêng + Pull Request
- ❌ **Không** commit file `node_modules/`, `bin/`, `obj/` — kiểm tra `.gitignore` trước khi commit lần đầu
- ❌ **Không** commit file chứa mật khẩu thật, connection string thật, JWT secret thật lên repo công khai
- ❌ **Không** tự ý sửa code trong module của người khác mà không báo trước (trừ khi được nhờ hỗ trợ)
- ❌ **Không** để branch `feature/xxx` sống quá lâu (quá 1 tuần không merge) — dễ lệch quá xa so với `main`, conflict sẽ rất nặng khi merge
- ❌ **Không** giải quyết conflict bằng cách xóa hết 1 bên rồi push bừa mà không đọc kỹ nội dung 2 bên khác nhau ở đâu

---

## 11. CHECKLIST TRƯỚC KHI PUSH

Tự kiểm tra trước mỗi lần `git push`:

- [ ] Code chạy được, không lỗi biên dịch
- [ ] Đã `git pull origin main` gần đây, không code trên code quá cũ
- [ ] Commit message rõ ràng, đúng format ở mục 5
- [ ] Không có file rác (`bin/`, `obj/`, `node_modules/`, file `.env` chứa secret thật) bị lỡ add vào — kiểm tra bằng `git status` trước khi `git add .`
- [ ] Nếu có sửa file dùng chung (`Program.cs`, `AppDbContext.cs`) — đã báo nhóm

---

## 12. LỆNH GIT TRA CỨU NHANH

| Lệnh | Công dụng |
|---|---|
| `git status` | Xem file nào đang thay đổi, chưa commit |
| `git pull origin main` | Lấy code mới nhất từ `main` |
| `git checkout -b feature/xxx` | Tạo branch mới và chuyển sang branch đó |
| `git checkout main` | Chuyển về branch `main` |
| `git add .` | Đưa toàn bộ thay đổi vào staging area |
| `git commit -m "..."` | Lưu lại thay đổi kèm mô tả |
| `git push origin feature/xxx` | Đẩy branch lên GitHub |
| `git log --oneline -10` | Xem 10 commit gần nhất, dạng rút gọn |
| `git diff` | Xem chi tiết những dòng đã thay đổi, chưa commit |
| `git branch -a` | Xem tất cả branch (cả local và remote) |
| `git branch -d feature/xxx` | Xóa branch local sau khi đã merge |
| `git stash` | Tạm cất thay đổi chưa commit (khi cần đổi branch gấp) |
| `git stash pop` | Lấy lại thay đổi vừa `stash` |

---

*File này nên được ghim (pin) trong nhóm chat hoặc để ở gốc repo (`README.md` hoặc thư mục `docs/`) để cả 3 người dễ tra cứu lại bất cứ lúc nào trong quá trình làm đồ án.*
