using backend.DTOs.Admin;

namespace backend.Services;

public interface IDashboardService
{
  Task<DashboardDto> GetOverviewAsync();
}
