using System.Security.Claims;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

/// <summary>
/// DbContext dùng chung cho cả ba module.
///
/// LƯU Ý khi làm việc nhóm: file này do cả 3 người cùng đụng vào.
/// Quy ước: chỉ thêm DbSet mới ở cuối danh sách, không sắp xếp lại thứ tự các dòng cũ.
/// Xem GITHUB-WORKFLOW-RULES.md mục 8.
/// </summary>
public class AppDbContext : DbContext
{
    private readonly IHttpContextAccessor? _http;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        IHttpContextAccessor? http = null)
        : base(options)
    {
        _http = http;
    }

    // ===== Module 1 — Hoàng: Xác thực & Người dùng =====
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserVerificationToken> UserVerificationTokens => Set<UserVerificationToken>();

    // ===== Module 2 — Long: Sản phẩm & Đấu giá =====
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Bid> Bids => Set<Bid>();
    public DbSet<AuctionWinner> AuctionWinners => Set<AuctionWinner>();
    public DbSet<WatchList> WatchLists => Set<WatchList>();

    // ===== Module 3 — Hằng: Thanh toán, Thông báo & Đánh giá =====
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ReportedProduct> ReportedProducts => Set<ReportedProduct>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Nạp toàn bộ lớp cấu hình trong thư mục Data/Configurations.
        // Các configuration riêng của từng module vẫn được load.
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);

        // ============================================================
        // USER
        // ============================================================

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(user => user.Id);

            entity.HasIndex(user => user.Username)
                .IsUnique();

            entity.HasIndex(user => user.Email)
                .IsUnique();

            entity.Property(user => user.Username)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(user => user.PasswordHash)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.FullName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(user => user.Phone)
                .HasMaxLength(20);

            entity.Property(user => user.Address)
                .HasMaxLength(255);

            entity.Property(user => user.Role)
                .HasMaxLength(20)
                .IsRequired();
        });

        // ============================================================
        // CATEGORY
        // ============================================================

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(category => category.Id);

            entity.HasIndex(category => category.Name)
                .IsUnique();

            entity.Property(category => category.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(category => category.Description)
                .HasMaxLength(255);

            entity.Property(category => category.IconUrl)
                .HasMaxLength(500);
        });

        // ============================================================
        // PRODUCT
        // ============================================================

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(product => product.Id);

            entity.Property(product => product.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(product => product.ImageUrl)
                .HasMaxLength(500);

            entity.Property(product => product.Status)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(product => product.StartPrice)
                .HasPrecision(18, 2);

            entity.Property(product => product.StepPrice)
                .HasPrecision(18, 2);

            entity.Property(product => product.CurrentPrice)
                .HasPrecision(18, 2);

            entity.Property(product => product.BuyNowPrice)
                .HasPrecision(18, 2);

            entity.Property(product => product.RowVersion)
                .IsRowVersion();

            entity.HasIndex(product =>
                new
                {
                    product.Status,
                    product.EndTime
                });

            entity.HasQueryFilter(product => !product.IsDeleted);

            entity.HasOne(product => product.Seller)
                .WithMany(user => user.Products)
                .HasForeignKey(product => product.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(product => product.Category)
                .WithMany(category => category.Products)
                .HasForeignKey(product => product.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(product => product.Approver)
                .WithMany(user => user.ApprovedProducts)
                .HasForeignKey(product => product.ApprovedBy)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ============================================================
        // PRODUCT IMAGE
        // ============================================================

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(image => image.Id);

            entity.Property(image => image.ImageUrl)
                .HasMaxLength(500)
                .IsRequired();

            entity.HasOne(image => image.Product)
                .WithMany(product => product.Images)
                .HasForeignKey(image => image.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ============================================================
        // BID
        // ============================================================

        modelBuilder.Entity<Bid>(entity =>
        {
            entity.HasKey(bid => bid.Id);

            entity.Property(bid => bid.BidAmount)
                .HasPrecision(18, 2);

            entity.HasIndex(bid =>
                new
                {
                    bid.ProductId,
                    bid.BidAmount
                });

            entity.HasOne(bid => bid.Product)
                .WithMany(product => product.Bids)
                .HasForeignKey(bid => bid.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(bid => bid.Bidder)
                .WithMany(user => user.Bids)
                .HasForeignKey(bid => bid.BidderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ============================================================
        // AUCTION WINNER
        // ============================================================

        modelBuilder.Entity<AuctionWinner>(entity =>
        {
            entity.HasKey(winner => winner.Id);

            entity.HasIndex(winner => winner.ProductId)
                .IsUnique();

            entity.HasIndex(winner => winner.WinningBidId)
                .IsUnique();

            entity.Property(winner => winner.WinningPrice)
                .HasPrecision(18, 2);

            entity.Property(winner => winner.Status)
                .HasMaxLength(20)
                .IsRequired();

            entity.HasOne(winner => winner.Product)
                .WithOne(product => product.AuctionWinner)
                .HasForeignKey<AuctionWinner>(
                    winner => winner.ProductId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(winner => winner.Winner)
                .WithMany(user => user.AuctionWins)
                .HasForeignKey(winner => winner.WinnerId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(winner => winner.WinningBid)
                .WithOne()
                .HasForeignKey<AuctionWinner>(
                    winner => winner.WinningBidId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ============================================================
        // WATCH LIST
        // ============================================================

        modelBuilder.Entity<WatchList>(entity =>
        {
            entity.HasKey(watch => watch.Id);

            entity.HasIndex(watch =>
                new
                {
                    watch.UserId,
                    watch.ProductId
                })
                .IsUnique();

            entity.HasOne(watch => watch.User)
                .WithMany(user => user.WatchLists)
                .HasForeignKey(watch => watch.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(watch => watch.Product)
                .WithMany(product => product.WatchLists)
                .HasForeignKey(watch => watch.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ============================================================
        // REVIEW
        // ============================================================

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(review => review.Id);

            entity.HasIndex(review =>
                new
                {
                    review.ProductId,
                    review.ReviewerId
                })
                .IsUnique();

            entity.HasOne(review => review.Product)
                .WithMany(product => product.Reviews)
                .HasForeignKey(review => review.ProductId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(review => review.Reviewer)
                .WithMany(user => user.Reviews)
                .HasForeignKey(review => review.ReviewerId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ============================================================
        // REPORTED PRODUCT
        // ============================================================

        modelBuilder.Entity<ReportedProduct>(entity =>
        {
            entity.HasKey(report => report.Id);

            entity.Property(report => report.Status)
                .HasMaxLength(20)
                .IsRequired();

            entity.HasOne(report => report.Product)
                .WithMany(product => product.Reports)
                .HasForeignKey(report => report.ProductId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(report => report.Reporter)
                .WithMany(user => user.ReportedProducts)
                .HasForeignKey(report => report.ReporterId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(report => report.Resolver)
                .WithMany(user => user.ResolvedReports)
                .HasForeignKey(report => report.ResolvedBy)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    /// <summary>
    /// Đọc Id người dùng hiện tại từ claim NameIdentifier của JWT.
    /// Claim này là chuỗi GUID nên phải TryParse.
    /// Trả null khi không có request (seed, background job, migration).
    /// </summary>
    private Guid? GetCurrentUserId()
    {
        var raw = _http?.HttpContext?.User?
            .FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(raw, out var id) ? id : null;
    }

    /// <summary>
    /// Ghi audit tự động (CreatedAt/By, UpdatedAt/By)
    /// và biến thao tác xóa cứng thành xóa mềm
    /// cho mọi entity kế thừa AuditableEntity.
    /// </summary>
    public override Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
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

                    // Chỉ gán CreatedAt nếu entity chưa có giá trị.
                    if (entry.Entity.CreatedAt == default)
                        entry.Entity.CreatedAt = now;

                    entry.Entity.CreatedBy = userId;
                    break;

                case EntityState.Modified:

                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    break;

                case EntityState.Deleted:

                    // Đổi xóa cứng thành xóa mềm.
                    entry.State = EntityState.Modified;
                    entry.Entity.DeletedAt = now;
                    entry.Entity.DeletedBy = userId;
                    break;
            }
        }
    }
}