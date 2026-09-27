using System.Security.Claims;
using backend.DTOs.Common;
using backend.DTOs.Review;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewController : ControllerBase
{
  private readonly IReviewService _reviews;

  public ReviewController(IReviewService reviews) => _reviews = reviews;

  private Guid CurrentUserId
  {
    get
    {
      var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
      return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
    }
  }

  /// <summary>Gửi đánh giá — chỉ người thắng đấu giá được đánh giá.</summary>
  [HttpPost]
  [Authorize]
  public async Task<ActionResult<ApiResponse<ReviewDto>>> Create([FromBody] CreateReviewDto dto)
  {
    var result = await _reviews.CreateAsync(CurrentUserId, dto);
    return StatusCode(201, ApiResponse<ReviewDto>.Ok(result, "Đánh giá thành công"));
  }

  /// <summary>Danh sách đánh giá của sản phẩm — công khai.</summary>
  [HttpGet("product/{productId:guid}")]
  [AllowAnonymous]
  public async Task<ActionResult<ApiResponse<List<ReviewDto>>>> GetByProduct(
      Guid productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
  {
    var result = await _reviews.GetByProductAsync(productId, page, pageSize);
    return Ok(ApiResponse<List<ReviewDto>>.Ok(result));
  }
}
