using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class AuctionWinner
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int WinnerId { get; set; }
    public int WinningBidId { get; set; }
    public decimal WinningPrice { get; set; }
    public DateTime WonAt { get; set; } = DateTime.UtcNow;

    [Required, MaxLength(20)]
    public string Status { get; set; } = "Pending";

    public Product Product { get; set; } = null!;
    public User Winner { get; set; } = null!;
    public Bid WinningBid { get; set; } = null!;
}