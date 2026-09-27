using System.Security.Claims;
using backend.DTOs.Common;
using backend.DTOs.Payment;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
  private readonly IPaymentService _payments;

  public PaymentController(IPaymentService payments) => _payments = payments;

  private Guid CurrentUserId
  {
    get
    {
      var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
      return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
    }
  }

  /// <summary>Mô phỏng thanh toán cho phiên thắng.</summary>
  [HttpPost("{auctionWinnerId:guid}/mock-pay")]
  [Authorize]
  public async Task<ActionResult<ApiResponse<PaymentDto>>> MockPay(Guid auctionWinnerId, [FromBody] MockPayDto dto)
  {
    var result = await _payments.MockPayAsync(CurrentUserId, auctionWinnerId, dto.PaymentMethod);
    return Ok(ApiResponse<PaymentDto>.Ok(result, "Thanh toán thành công"));
  }

  /// <summary>Lịch sử thanh toán của bản thân.</summary>
  [HttpGet("my")]
  [Authorize]
  public async Task<ActionResult<ApiResponse<List<PaymentDto>>>> GetMy(
      [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
  {
    var result = await _payments.GetMyAsync(CurrentUserId, page, pageSize);
    return Ok(ApiResponse<List<PaymentDto>>.Ok(result));
  }
}
