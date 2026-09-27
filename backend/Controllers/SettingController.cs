using backend.DTOs.Common;
using backend.DTOs.Setting;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize(Roles = "Admin")]
public class SettingController : ControllerBase
{
  private readonly ISettingService _settings;

  public SettingController(ISettingService settings) => _settings = settings;

  [HttpGet]
  public async Task<ActionResult<ApiResponse<List<SettingDto>>>> GetAll()
  {
    var result = await _settings.GetAllAsync();
    return Ok(ApiResponse<List<SettingDto>>.Ok(result));
  }

  [HttpGet("{key}")]
  public async Task<ActionResult<ApiResponse<SettingDto>>> GetByKey(string key)
  {
    var result = await _settings.GetByKeyAsync(key);
    return Ok(ApiResponse<SettingDto>.Ok(result));
  }

  [HttpPut("{key}")]
  public async Task<ActionResult<ApiResponse<SettingDto>>> UpdateByKey(string key, [FromBody] UpdateSettingDto dto)
  {
    var result = await _settings.UpdateByKeyAsync(key, dto);
    return Ok(ApiResponse<SettingDto>.Ok(result, "Cập nhật cấu hình thành công"));
  }

  [HttpPost]
  public async Task<ActionResult<ApiResponse<SettingDto>>> Upsert([FromBody] UpsertSettingDto dto)
  {
    var result = await _settings.UpsertAsync(dto);
    return Ok(ApiResponse<SettingDto>.Ok(result, "Lưu cấu hình thành công"));
  }
}
