using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class ReportedProduct
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int ReporterId { get; set; }

    [Required]
    public string Reason { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Status { get; set; } = "Pending";

    public int? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
    public User Reporter { get; set; } = null!;
    public User? Resolver { get; set; }
}