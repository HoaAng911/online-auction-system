using backend.Data;
using backend.DTOs.Payment;
using backend.Middlewares;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class PaymentService : IPaymentService
{
  private readonly AppDbContext _db;

  public PaymentService(AppDbContext db) => _db = db;

  /// <summary>
  /// Mô phỏng thanh toán cho phiên thắng. Chỉ người thắng mới được thanh toán.
  /// Kiểm tra PaymentMethod hợp lệ, tạo Payment với Status = Success.
  /// </summary>
  public async Task<PaymentDto> MockPayAsync(Guid userId, Guid auctionWinnerId, string paymentMethod)
  {
    if (!Models.PaymentMethod.IsValid(paymentMethod))
      throw new AppException("Phương thức thanh toán không hợp lệ. Cho phép: VNPay, Momo, COD, BankTransfer", 400);

    var winner = await _db.AuctionWinners.FirstOrDefaultAsync(a => a.Id == auctionWinnerId)
        ?? throw new AppException("Không tìm thấy phiên thắng", 404);

    if (winner.WinnerId != userId)
      throw new AppException("Bạn không phải người thắng phiên này", 403);

    if (winner.Status == AuctionWinnerStatus.Paid || winner.Status == AuctionWinnerStatus.Completed)
      throw new AppException("Phiên này đã được thanh toán", 409);

    if (winner.Status == AuctionWinnerStatus.Cancelled)
      throw new AppException("Phiên đã bị hủy, không thể thanh toán", 400);

    var existing = await _db.Payments.FirstOrDefaultAsync(p => p.AuctionWinnerId == auctionWinnerId);
    if (existing is not null)
    {
      if (existing.Status == PaymentStatus.Success)
        throw new AppException("Phiên này đã được thanh toán", 409);
      // Nếu payment cũ ở trạng thái Failed/Pending thì cho phép thử lại — cập nhật lại.
      existing.PaymentMethod = paymentMethod;
      existing.Status = PaymentStatus.Success;
      existing.PaidAt = DateTime.UtcNow;
      existing.TransactionId = $"MOCK-{Guid.NewGuid():N}"[..20].ToUpperInvariant();
      winner.Status = AuctionWinnerStatus.Paid;
      await _db.SaveChangesAsync();
      return ToDto(existing);
    }

    var payment = new Payment
    {
      AuctionWinnerId = auctionWinnerId,
      PaymentMethod = paymentMethod,
      Amount = winner.WinningPrice,
      Status = PaymentStatus.Success,
      PaidAt = DateTime.UtcNow,
      TransactionId = $"MOCK-{Guid.NewGuid():N}"[..20].ToUpperInvariant()
    };

    winner.Status = AuctionWinnerStatus.Paid;
    _db.Payments.Add(payment);
    await _db.SaveChangesAsync();
    return ToDto(payment);
  }

  public async Task<List<PaymentDto>> GetMyAsync(Guid userId, int page, int pageSize)
  {
    page = Math.Max(page, 1);
    pageSize = Math.Clamp(pageSize, 1, 100);

    return await _db.Payments
        .Where(p => p.AuctionWinner.WinnerId == userId)
        .OrderByDescending(p => p.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(p => new PaymentDto
        {
          Id = p.Id,
          AuctionWinnerId = p.AuctionWinnerId,
          PaymentMethod = p.PaymentMethod,
          Amount = p.Amount,
          TransactionId = p.TransactionId,
          Status = p.Status,
          PaidAt = p.PaidAt,
          CreatedAt = p.CreatedAt
        })
        .ToListAsync();
  }

  private static PaymentDto ToDto(Payment p) => new()
  {
    Id = p.Id,
    AuctionWinnerId = p.AuctionWinnerId,
    PaymentMethod = p.PaymentMethod,
    Amount = p.Amount,
    TransactionId = p.TransactionId,
    Status = p.Status,
    PaidAt = p.PaidAt,
    CreatedAt = p.CreatedAt
  };
}
