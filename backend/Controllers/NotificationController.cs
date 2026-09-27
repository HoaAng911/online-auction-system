using System.Security.Claims;
using backend.DTOs.Common;
using backend.DTOs.Notification;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
  private readonly INotificationService _notifications;

  public NotificationController(INotificationService notifications) => _notifications = notifications;

  private Guid CurrentUserId
  {
    get
    {
      var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
      return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
    }
  }

  [HttpGet]
  [Authorize]
  public async Task<ActionResult<ApiResponse<List<NotificationDto>>>> GetMy(
      [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
  {
    var result = await _notifications.GetMyAsync(CurrentUserId, page, pageSize);
    return Ok(ApiResponse<List<NotificationDto>>.Ok(result));
  }

  [HttpGet("unread-count")]
  [Authorize]
  public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
  {
    var count = await _notifications.GetUnreadCountAsync(CurrentUserId);
    return Ok(ApiResponse<int>.Ok(count));
  }

  [HttpPut("{id:guid}/read")]
  [Authorize]
  public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(Guid id)
  {
    await _notifications.MarkAsReadAsync(CurrentUserId, id);
    return Ok(ApiResponse<object>.Ok(null, "Đã đánh dấu đã đọc"));
  }

  [HttpPut("read-all")]
  [Authorize]
  public async Task<ActionResult<ApiResponse<object>>> MarkAllAsRead()
  {
    await _notifications.MarkAllAsReadAsync(CurrentUserId);
    return Ok(ApiResponse<object>.Ok(null, "Đã đánh dấu tất cả đã đọc"));
  }
}
