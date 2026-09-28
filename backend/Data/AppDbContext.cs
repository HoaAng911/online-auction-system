using Microsoft.EntityFrameworkCore;
using backend.Models;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
	public DbSet<User> Users => Set<User>();
	public DbSet<Category> Categories => Set<Category>();
	public DbSet<Product> Products => Set<Product>();
	public DbSet<ProductImage> ProductImages => Set<ProductImage>();
	public DbSet<Bid> Bids => Set<Bid>();
	public DbSet<AuctionWinner> AuctionWinners => Set<AuctionWinner>();
	public DbSet<WatchList> WatchLists => Set<WatchList>();
	public DbSet<Review> Reviews => Set<Review>();
	public DbSet<ReportedProduct> ReportedProducts => Set<ReportedProduct>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		base.OnModelCreating(modelBuilder);

		modelBuilder.Entity<User>(entity =>
		{
			entity.HasKey(user => user.Id);
			entity.HasIndex(user => user.Username).IsUnique();
			entity.HasIndex(user => user.Email).IsUnique();
			entity.Property(user => user.Username).HasMaxLength(50).IsRequired();
			entity.Property(user => user.Email).HasMaxLength(100).IsRequired();
			entity.Property(user => user.PasswordHash).HasMaxLength(255).IsRequired();
			entity.Property(user => user.FullName).HasMaxLength(100).IsRequired();
			entity.Property(user => user.Phone).HasMaxLength(20);
			entity.Property(user => user.Address).HasMaxLength(255);
			entity.Property(user => user.Role).HasMaxLength(20).IsRequired();
		});

		modelBuilder.Entity<Category>(entity =>
		{
			entity.HasKey(category => category.Id);
			entity.HasIndex(category => category.Name).IsUnique();
			entity.Property(category => category.Name).HasMaxLength(100).IsRequired();
			entity.Property(category => category.Description).HasMaxLength(255);
			entity.Property(category => category.IconUrl).HasMaxLength(500);
		});

		modelBuilder.Entity<Product>(entity =>
		{
			entity.HasKey(product => product.Id);
			entity.Property(product => product.Title).HasMaxLength(200).IsRequired();
			entity.Property(product => product.ImageUrl).HasMaxLength(500);
			entity.Property(product => product.Status).HasMaxLength(20).IsRequired();
			entity.Property(product => product.StartPrice).HasPrecision(18, 2);
			entity.Property(product => product.StepPrice).HasPrecision(18, 2);
			entity.Property(product => product.CurrentPrice).HasPrecision(18, 2);
			entity.Property(product => product.BuyNowPrice).HasPrecision(18, 2);
			entity.Property(product => product.RowVersion).IsRowVersion();
			entity.HasIndex(product => new { product.Status, product.EndTime });
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

		modelBuilder.Entity<ProductImage>(entity =>
		{
			entity.HasKey(image => image.Id);
			entity.Property(image => image.ImageUrl).HasMaxLength(500).IsRequired();
			entity.HasOne(image => image.Product)
				.WithMany(product => product.Images)
				.HasForeignKey(image => image.ProductId)
				.OnDelete(DeleteBehavior.Cascade);
		});

		modelBuilder.Entity<Bid>(entity =>
		{
			entity.HasKey(bid => bid.Id);
			entity.Property(bid => bid.BidAmount).HasPrecision(18, 2);
			entity.HasIndex(bid => new { bid.ProductId, bid.BidAmount });
			entity.HasOne(bid => bid.Product)
				.WithMany(product => product.Bids)
				.HasForeignKey(bid => bid.ProductId)
				.OnDelete(DeleteBehavior.Cascade);
			entity.HasOne(bid => bid.Bidder)
				.WithMany(user => user.Bids)
				.HasForeignKey(bid => bid.BidderId)
				.OnDelete(DeleteBehavior.Restrict);
		});

		modelBuilder.Entity<AuctionWinner>(entity =>
		{
			entity.HasKey(winner => winner.Id);
			entity.HasIndex(winner => winner.ProductId).IsUnique();
			entity.HasIndex(winner => winner.WinningBidId).IsUnique();
			entity.Property(winner => winner.WinningPrice).HasPrecision(18, 2);
			entity.Property(winner => winner.Status).HasMaxLength(20).IsRequired();
			entity.HasOne(winner => winner.Product)
				.WithOne(product => product.AuctionWinner)
				.HasForeignKey<AuctionWinner>(winner => winner.ProductId)
				.OnDelete(DeleteBehavior.NoAction);
			entity.HasOne(winner => winner.Winner)
				.WithMany(user => user.AuctionWins)
				.HasForeignKey(winner => winner.WinnerId)
				.OnDelete(DeleteBehavior.NoAction);
			entity.HasOne(winner => winner.WinningBid)
				.WithOne()
				.HasForeignKey<AuctionWinner>(winner => winner.WinningBidId)
				.OnDelete(DeleteBehavior.NoAction);
		});

		modelBuilder.Entity<WatchList>(entity =>
		{
			entity.HasKey(watch => watch.Id);
			entity.HasIndex(watch => new { watch.UserId, watch.ProductId }).IsUnique();
			entity.HasOne(watch => watch.User)
				.WithMany(user => user.WatchLists)
				.HasForeignKey(watch => watch.UserId)
				.OnDelete(DeleteBehavior.Cascade);
			entity.HasOne(watch => watch.Product)
				.WithMany(product => product.WatchLists)
				.HasForeignKey(watch => watch.ProductId)
				.OnDelete(DeleteBehavior.Cascade);
		});

		modelBuilder.Entity<Review>(entity =>
		{
			entity.HasKey(review => review.Id);
			entity.HasIndex(review => new { review.ProductId, review.ReviewerId }).IsUnique();
			entity.HasOne(review => review.Product)
				.WithMany(product => product.Reviews)
				.HasForeignKey(review => review.ProductId)
				.OnDelete(DeleteBehavior.NoAction);
			entity.HasOne(review => review.Reviewer)
				.WithMany(user => user.Reviews)
				.HasForeignKey(review => review.ReviewerId)
				.OnDelete(DeleteBehavior.NoAction);
		});

		modelBuilder.Entity<ReportedProduct>(entity =>
		{
			entity.HasKey(report => report.Id);
			entity.Property(report => report.Status).HasMaxLength(20).IsRequired();
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
}