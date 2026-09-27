using backend.DTOs.Admin;
using backend.DTOs.Common;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
  private readonly IDashboardService _dashboard;

  public AdminController(IDashboardService dashboard) => _dashboard = dashboard;

  /// <summary>Thống kê tổng quan — tổng hợp từ dữ liệu sẵn có, không cần bảng mới.</summary>
  [HttpGet("dashboard")]
  public async Task<ActionResult<ApiResponse<DashboardDto>>> GetDashboard()
  {
    var result = await _dashboard.GetOverviewAsync();
    return Ok(ApiResponse<DashboardDto>.Ok(result));
  }
}
