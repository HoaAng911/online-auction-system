namespace backend.DTOs.Admin;

public class DashboardDto
{
  public int TotalUsers { get; set; }
  public int TotalAuctionWinners { get; set; }
  public int TotalPayments { get; set; }
  public decimal TotalRevenue { get; set; }
  public int TotalReviews { get; set; }
  public double AverageRating { get; set; }
  public int PendingPayments { get; set; }
  public int UnreadNotifications { get; set; }
}
