using backend.Data;
using backend.DTOs.Review;
using backend.Middlewares;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class ReviewService : IReviewService
{
  private readonly AppDbContext _db;

  public ReviewService(AppDbContext db) => _db = db;

  /// <summary>
  /// Chỉ người thắng đấu giá mới được đánh giá, mỗi sản phẩm chỉ đánh giá một lần.
  /// </summary>
  public async Task<ReviewDto> CreateAsync(Guid reviewerId, CreateReviewDto dto)
  {
    if (dto.Rating < 1 || dto.Rating > 5)
      throw new AppException("Rating phải từ 1 đến 5", 400);

    // Kiểm tra người này có phải người thắng của sản phẩm không.
    var isWinner = await _db.AuctionWinners.AnyAsync(a =>
        a.ProductId == dto.ProductId && a.WinnerId == reviewerId);
    if (!isWinner)
      throw new AppException("Chỉ người thắng đấu giá mới được đánh giá sản phẩm này", 403);

    var exists = await _db.Reviews.AnyAsync(r =>
        r.ProductId == dto.ProductId && r.ReviewerId == reviewerId);
    if (exists)
      throw new AppException("Bạn đã đánh giá sản phẩm này rồi", 409);

    var review = new Review
    {
      ProductId = dto.ProductId,
      ReviewerId = reviewerId,
      Rating = dto.Rating,
      Comment = dto.Comment?.Trim()
    };

    _db.Reviews.Add(review);
    await _db.SaveChangesAsync();

    var reviewer = await _db.Users.FirstOrDefaultAsync(u => u.Id == reviewerId);
    return ToDto(review, reviewer?.FullName);
  }

  public async Task<List<ReviewDto>> GetByProductAsync(Guid productId, int page, int pageSize)
  {
    page = Math.Max(page, 1);
    pageSize = Math.Clamp(pageSize, 1, 100);

    return await _db.Reviews
        .Where(r => r.ProductId == productId)
        .OrderByDescending(r => r.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(r => new ReviewDto
        {
          Id = r.Id,
          ProductId = r.ProductId,
          ReviewerId = r.ReviewerId,
          ReviewerName = r.Reviewer.FullName,
          Rating = r.Rating,
          Comment = r.Comment,
          CreatedAt = r.CreatedAt
        })
        .ToListAsync();
  }

  private static ReviewDto ToDto(Review r, string? reviewerName) => new()
  {
    Id = r.Id,
    ProductId = r.ProductId,
    ReviewerId = r.ReviewerId,
    ReviewerName = reviewerName,
    Rating = r.Rating,
    Comment = r.Comment,
    CreatedAt = r.CreatedAt
  };
}
