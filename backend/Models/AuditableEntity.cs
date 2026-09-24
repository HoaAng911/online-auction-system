namespace backend.Models;

/// <summary>
/// Lớp cơ sở cho các entity cần audit đầy đủ (6 cột) và xóa mềm.
/// Xem THIET-KE-BANG-MODULE-HOANG.md mục 5.2.
/// Các cột này được ghi tự động trong AppDbContext.SaveChangesAsync, service không gán tay.
/// </summary>
public abstract class AuditableEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}