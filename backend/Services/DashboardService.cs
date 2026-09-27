using backend.Data;
using backend.DTOs.Admin;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class DashboardService : IDashboardService
{
  private readonly AppDbContext _db;

  public DashboardService(AppDbContext db) => _db = db;

  public async Task<DashboardDto> GetOverviewAsync()
  {
    var totalUsers = await _db.Users.CountAsync();
    var totalWinners = await _db.AuctionWinners.CountAsync();
    var totalPayments = await _db.Payments.CountAsync();
    var totalRevenue = await _db.Payments
        .Where(p => p.Status == Models.PaymentStatus.Success)
        .SumAsync(p => (decimal?)p.Amount) ?? 0m;
    var totalReviews = await _db.Reviews.CountAsync();
    var avgRating = await _db.Reviews.AnyAsync()
        ? await _db.Reviews.AverageAsync(r => r.Rating)
        : 0;
    var pendingPayments = await _db.Payments.CountAsync(p => p.Status == Models.PaymentStatus.Pending);
    var unreadNotifications = await _db.Notifications.CountAsync(n => !n.IsRead);

    return new DashboardDto
    {
      TotalUsers = totalUsers,
      TotalAuctionWinners = totalWinners,
      TotalPayments = totalPayments,
      TotalRevenue = totalRevenue,
      TotalReviews = totalReviews,
      AverageRating = Math.Round(avgRating, 2),
      PendingPayments = pendingPayments,
      UnreadNotifications = unreadNotifications
    };
  }
}
