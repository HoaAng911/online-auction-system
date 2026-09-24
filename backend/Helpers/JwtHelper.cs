using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;
using Microsoft.IdentityModel.Tokens;

namespace backend.Helpers;

/// <summary>
/// Sinh access token JWT. Thời hạn đọc từ Jwt:AccessTokenMinutes (mặc định 30 phút).
/// Claim NameIdentifier là Guid dạng chuỗi (mục 1.4).
/// </summary>
public class JwtHelper
{
  private readonly IConfiguration _config;

  public JwtHelper(IConfiguration config) => _config = config;

  public (string Token, DateTime ExpiresAt) GenerateToken(User user)
  {
    var secret = _config["Jwt:Secret"]!;
    var minutes = int.TryParse(_config["Jwt:AccessTokenMinutes"], out var m) ? m : 30;
    var expiresAt = DateTime.UtcNow.AddMinutes(minutes);

    var claims = new[]
    {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: _config["Jwt:Issuer"],
        audience: _config["Jwt:Audience"],
        claims: claims,
        expires: expiresAt,
        signingCredentials: creds);

    return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
  }
}
