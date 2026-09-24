namespace backend.DTOs.Common;

/// <summary>
/// Cấu trúc phản hồi chuẩn cho mọi endpoint (mục 3.1 tài liệu gốc).
/// JSON sẽ được serialize camelCase nhờ cấu hình trong Program.cs.
/// </summary>
public class ApiResponse<T>
{
  public bool Success { get; set; }
  public string Message { get; set; } = string.Empty;
  public T? Data { get; set; }
  public List<string>? Errors { get; set; }

  public static ApiResponse<T> Ok(T? data, string message = "Thành công")
      => new() { Success = true, Message = message, Data = data };

  public static ApiResponse<T> Fail(string message, List<string>? errors = null, int _ = 0)
      => new() { Success = false, Message = message, Errors = errors };
}
