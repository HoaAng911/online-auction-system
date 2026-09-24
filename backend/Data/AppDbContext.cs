using System.Security.Claims;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

/// <summary>
/// DbContext dùng chung cho cả ba module.
/// LƯU Ý khi làm việc nhóm: file này do cả 3 người cùng đụng vào.
/// Quy ước: chỉ thêm DbSet mới ở cuối danh sách, không sắp xếp lại thứ tự các dòng cũ.
/// Xem GITHUB-WORKFLOW-RULES.md mục 8.
/// </summary>
public class AppDbContext : DbContext
{
    private readonly IHttpContextAccessor? _http;

    public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor? http = null)
        : base(options)
    {
        _http = http;
    }

    // ===== Module 1 — Hoàng: Xác thực & Người dùng =====
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserVerificationToken> UserVerificationTokens => Set<UserVerificationToken>();

    // ===== Module 2 — Long: Sản phẩm & Đấu giá (thêm DbSet ở dưới dòng này) =====


    // ===== Module 3 — Hằng: Thanh toán, Thông báo & Đánh giá (thêm DbSet ở dưới dòng này) =====


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Nạp toàn bộ lớp cấu hình trong thư mục Data/Configurations.
        // Mỗi thành viên tự quản lý file cấu hình của module mình trong thư mục này.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    /// <summary>
    /// Đọc Id người dùng hiện tại từ claim NameIdentifier của JWT.
    /// Claim này là chuỗi GUID nên phải TryParse (mục 1.4).
    /// Trả null khi không có request (seed, background job, migration).
    /// </summary>
    private Guid? GetCurrentUserId()
    {
        var raw = _http?.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }

    /// <summary>
    /// Ghi audit tự động (CreatedAt/By, UpdatedAt/By) và biến thao tác xóa cứng
    /// thành xóa mềm cho mọi entity kế thừa AuditableEntity (mục 5.3).
    /// </summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditInfo();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ApplyAuditInfo();
        return base.SaveChanges();
    }

    private void ApplyAuditInfo()
    {
        var userId = GetCurrentUserId();
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    // Chỉ gán CreatedAt nếu entity chưa có giá trị (tránh ghi đè
                    // giá trị đã gán ở constructor AuditableEntity hoặc HasDefaultValueSql GETUTCDATE).
                    // Nếu CreatedAt vẫn là default(DateTime) thì gán now, ngược lại giữ nguyên.
                    if (entry.Entity.CreatedAt == default)
                        entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = userId;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    break;

                case EntityState.Deleted:
                    // Đổi xóa cứng thành xóa mềm. ON DELETE CASCADE không chạy khi
                    // xóa mềm, nên service phải tự thu hồi RefreshTokens (mục 5.4).
                    entry.State = EntityState.Modified;
                    entry.Entity.DeletedAt = now;
                    entry.Entity.DeletedBy = userId;
                    break;
            }
        }
    }
}