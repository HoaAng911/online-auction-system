using backend.DTOs.Setting;

namespace backend.Services;

public interface ISettingService
{
  Task<List<SettingDto>> GetAllAsync();
  Task<SettingDto> GetByKeyAsync(string key);
  Task<SettingDto> UpsertAsync(UpsertSettingDto dto);
  Task<SettingDto> UpdateByKeyAsync(string key, UpdateSettingDto dto);
}
