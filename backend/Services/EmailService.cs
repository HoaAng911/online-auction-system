namespace backend.Services;

/// <summary>
/// Mô phỏng gửi email bằng log (mục 5.5). Không tích hợp SMTP thật.
/// </summary>
public interface IEmailService
{
  Task SendVerificationEmailAsync(string email, string token);
  Task SendPasswordResetEmailAsync(string email, string token);
}

public class EmailService : IEmailService
{
  private readonly ILogger<EmailService> _logger;
  private readonly IConfiguration _config;

  public EmailService(ILogger<EmailService> logger, IConfiguration config)
  {
    _logger = logger;
    _config = config;
  }

  public Task SendVerificationEmailAsync(string email, string token)
  {
    var baseUrl = _config["App:ClientUrl"] ?? "http://localhost:5173";
    var link = $"{baseUrl}/verify-email?token={token}";
    _logger.LogInformation("[EmailService] Xác thực email cho {Email}: {Link}", email, link);
    return Task.CompletedTask;
  }

  public Task SendPasswordResetEmailAsync(string email, string token)
  {
    var baseUrl = _config["App:ClientUrl"] ?? "http://localhost:5173";
    var link = $"{baseUrl}/reset-password?token={token}";
    _logger.LogInformation("[EmailService] Đặt lại mật khẩu cho {Email}: {Link}", email, link);
    return Task.CompletedTask;
  }
}
