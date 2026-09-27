using backend.Data;
using backend.DTOs.Notification;
using backend.Middlewares;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class NotificationService : INotificationService
{
  private readonly AppDbContext _db;

  public NotificationService(AppDbContext db) => _db = db;

  public async Task CreateAsync(
      Guid userId,
      string title,
      string message,
      string type,
      string? relatedEntityType = null,
      Guid? relatedEntityId = null)
  {
    var n = new Notification
    {
      UserId = userId,
      Title = title.Trim(),
      Message = message.Trim(),
      Type = type,
      RelatedEntityType = relatedEntityType,
      RelatedEntityId = relatedEntityId
    };
    _db.Notifications.Add(n);
    await _db.SaveChangesAsync();
  }

  public async Task<List<NotificationDto>> GetMyAsync(Guid userId, int page, int pageSize)
  {
    page = Math.Max(page, 1);
    pageSize = Math.Clamp(pageSize, 1, 100);

    return await _db.Notifications
        .Where(n => n.UserId == userId)
        .OrderByDescending(n => n.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(n => new NotificationDto
        {
          Id = n.Id,
          Title = n.Title,
          Message = n.Message,
          Type = n.Type,
          RelatedEntityType = n.RelatedEntityType,
          RelatedEntityId = n.RelatedEntityId,
          IsRead = n.IsRead,
          CreatedAt = n.CreatedAt
        })
        .ToListAsync();
  }

  public async Task<int> GetUnreadCountAsync(Guid userId)
  {
    return await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
  }

  public async Task MarkAsReadAsync(Guid userId, Guid notificationId)
  {
    var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == notificationId)
        ?? throw new AppException("Không tìm thấy thông báo", 404);

    if (n.UserId != userId)
      throw new AppException("Không có quyền thao tác thông báo này", 403);

    if (!n.IsRead)
    {
      n.IsRead = true;
      await _db.SaveChangesAsync();
    }
  }

  public async Task MarkAllAsReadAsync(Guid userId)
  {
    await _db.Notifications
        .Where(n => n.UserId == userId && !n.IsRead)
        .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
  }
}
