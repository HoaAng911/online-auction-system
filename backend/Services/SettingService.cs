using backend.Data;
using backend.DTOs.Setting;
using backend.Middlewares;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class SettingService : ISettingService
{
  private readonly AppDbContext _db;

  public SettingService(AppDbContext db) => _db = db;

  public async Task<List<SettingDto>> GetAllAsync()
  {
    return await _db.Settings
        .OrderBy(s => s.Key)
        .Select(s => new SettingDto
        {
          Id = s.Id,
          Key = s.Key,
          Value = s.Value,
          Description = s.Description,
          UpdatedAt = s.UpdatedAt
        })
        .ToListAsync();
  }

  public async Task<SettingDto> GetByKeyAsync(string key)
  {
    var s = await _db.Settings.FirstOrDefaultAsync(x => x.Key == key)
        ?? throw new AppException($"Không tìm thấy cấu hình '{key}'", 404);
    return ToDto(s);
  }

  public async Task<SettingDto> UpsertAsync(UpsertSettingDto dto)
  {
    var existing = await _db.Settings.FirstOrDefaultAsync(s => s.Key == dto.Key);
    if (existing is not null)
    {
      existing.Value = dto.Value;
      if (dto.Description is not null) existing.Description = dto.Description;
      existing.UpdatedAt = DateTime.UtcNow;
      await _db.SaveChangesAsync();
      return ToDto(existing);
    }

    var setting = new Setting
    {
      Key = dto.Key.Trim(),
      Value = dto.Value,
      Description = dto.Description
    };
    _db.Settings.Add(setting);
    await _db.SaveChangesAsync();
    return ToDto(setting);
  }

  public async Task<SettingDto> UpdateByKeyAsync(string key, UpdateSettingDto dto)
  {
    var s = await _db.Settings.FirstOrDefaultAsync(x => x.Key == key)
        ?? throw new AppException($"Không tìm thấy cấu hình '{key}'", 404);

    s.Value = dto.Value;
    if (dto.Description is not null) s.Description = dto.Description;
    s.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();
    return ToDto(s);
  }

  private static SettingDto ToDto(Setting s) => new()
  {
    Id = s.Id,
    Key = s.Key,
    Value = s.Value,
    Description = s.Description,
    UpdatedAt = s.UpdatedAt
  };
}
