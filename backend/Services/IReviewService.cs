using backend.DTOs.Review;

namespace backend.Services;

public interface IReviewService
{
  Task<ReviewDto> CreateAsync(Guid reviewerId, CreateReviewDto dto);
  Task<List<ReviewDto>> GetByProductAsync(Guid productId, int page, int pageSize);
}
