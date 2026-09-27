using backend.DTOs.Notification;

namespace backend.Services;

/// <summary>
/// Dịch vụ thông báo dùng chung cho cả ba module (mục 7.4 tài liệu gốc).
/// Hằng hoàn thiện trong tuần đầu tiên, công bố chữ ký cho Hoàng và Long.
/// </summary>
public interface INotificationService
{
  Task CreateAsync(
      Guid userId,
      string title,
      string message,
      string type,
      string? relatedEntityType = null,
      Guid? relatedEntityId = null);

  Task<List<NotificationDto>> GetMyAsync(Guid userId, int page, int pageSize);
  Task<int> GetUnreadCountAsync(Guid userId);
  Task MarkAsReadAsync(Guid userId, Guid notificationId);
  Task MarkAllAsReadAsync(Guid userId);
}
