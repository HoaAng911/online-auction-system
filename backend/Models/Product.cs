using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class Product
{
    public int Id { get; set; }
    public int SellerId { get; set; }
    public int CategoryId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [Range(0, double.MaxValue)]
    public decimal StartPrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal StepPrice { get; set; } = 10000;

    [Range(0, double.MaxValue)]
    public decimal CurrentPrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? BuyNowPrice { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    [Required, MaxLength(20)]
    public string Status { get; set; } = "Pending";

    public int ViewCount { get; set; }
    public int BidCount { get; set; }
    public bool IsDeleted { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public User Seller { get; set; } = null!;
    public User? Approver { get; set; }
    public Category Category { get; set; } = null!;
    public ICollection<Bid> Bids { get; set; } = new List<Bid>();
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public AuctionWinner? AuctionWinner { get; set; }
    public ICollection<WatchList> WatchLists { get; set; } = new List<WatchList>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<ReportedProduct> Reports { get; set; } = new List<ReportedProduct>();
}