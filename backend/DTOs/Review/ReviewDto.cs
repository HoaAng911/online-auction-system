using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Review;

public class ReviewDto
{
  public Guid Id { get; set; }
  public Guid ProductId { get; set; }
  public Guid ReviewerId { get; set; }
  public string? ReviewerName { get; set; }
  public int Rating { get; set; }
  public string? Comment { get; set; }
  public DateTime CreatedAt { get; set; }
}

public class CreateReviewDto
{
  [Required(ErrorMessage = "ProductId là bắt buộc")]
  public Guid ProductId { get; set; }

  [Required(ErrorMessage = "Rating là bắt buộc")]
  [Range(1, 5, ErrorMessage = "Rating phải từ 1 đến 5")]
  public int Rating { get; set; }

  [MaxLength(2000, ErrorMessage = "Nhận xét tối đa 2000 ký tự")]
  public string? Comment { get; set; }
}
