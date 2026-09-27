using backend.DTOs.Payment;

namespace backend.Services;

public interface IPaymentService
{
  Task<PaymentDto> MockPayAsync(Guid userId, Guid auctionWinnerId, string paymentMethod);
  Task<List<PaymentDto>> GetMyAsync(Guid userId, int page, int pageSize);
}
