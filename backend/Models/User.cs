using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    [Required, MaxLength(20)]
    public string Role { get; set; } = "User";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Product> ApprovedProducts { get; set; } = new List<Product>();
    public ICollection<Bid> Bids { get; set; } = new List<Bid>();
    public ICollection<AuctionWinner> AuctionWins { get; set; } = new List<AuctionWinner>();
    public ICollection<WatchList> WatchLists { get; set; } = new List<WatchList>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<ReportedProduct> ReportedProducts { get; set; } = new List<ReportedProduct>();
    public ICollection<ReportedProduct> ResolvedReports { get; set; } = new List<ReportedProduct>();
}