using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class Bid
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int BidderId { get; set; }

    [Range(0, double.MaxValue)]
    public decimal BidAmount { get; set; }

    public DateTime BidTime { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
    public User Bidder { get; set; } = null!;
}