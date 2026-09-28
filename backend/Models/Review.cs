using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class Review
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int ReviewerId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
    public User Reviewer { get; set; } = null!;
}