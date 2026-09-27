using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Payment;

public class PaymentDto
{
  public Guid Id { get; set; }
  public Guid AuctionWinnerId { get; set; }
  public string PaymentMethod { get; set; } = string.Empty;
  public decimal Amount { get; set; }
  public string? TransactionId { get; set; }
  public string Status { get; set; } = string.Empty;
  public DateTime? PaidAt { get; set; }
  public DateTime CreatedAt { get; set; }
}

public class MockPayDto
{
  [Required(ErrorMessage = "Phương thức thanh toán là bắt buộc")]
  public string PaymentMethod { get; set; } = string.Empty;
}
