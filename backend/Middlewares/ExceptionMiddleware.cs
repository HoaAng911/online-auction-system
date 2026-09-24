using System.Net;
using System.Text.Json;

namespace backend.Middlewares;

/// <summary>
/// Middleware xử lý lỗi tập trung cho toàn bộ dự án (mục 5.5 tài liệu gốc).
/// Trả về đúng cấu trúc ApiResponse camelCase, không lộ stack trace.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            _logger.LogWarning(ex, "AppException {StatusCode}: {Message}", ex.StatusCode, ex.Message);
            await WriteResponseAsync(context, ex.StatusCode, ex.Message, null);
        }
        catch (Exception ex)
        {
            // Không bao giờ ghi mật khẩu gốc hoặc hash vào log (mục 7.5).
            _logger.LogError(ex, "Unhandled exception");
            await WriteResponseAsync(context, (int)HttpStatusCode.InternalServerError, "Lỗi hệ thống", null);
        }
    }

    private static Task WriteResponseAsync(HttpContext context, int statusCode, string message, List<string>? errors)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;
        var payload = new { success = false, message, data = (object?)null, errors };
        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        return context.Response.WriteAsync(json);
    }
}

/// <summary>
/// Exception nghiệp vụ có mã HTTP đi kèm. Service throw loại này để middleware trả đúng status.
/// </summary>
public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(string message, int statusCode = 400) : base(message)
    {
        StatusCode = statusCode;
    }
}
