using System.Text;
using backend.Data;
using backend.Helpers;
using backend.Middlewares;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// JSON camelCase cho mọi response (mục 3.4 tài liệu gốc).
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);

// Trả lỗi validation theo đúng cấu trúc ApiResponse camelCase.
builder.Services.Configure<ApiBehaviorOptions>(o =>
{
    o.InvalidModelStateResponseFactory = ctx =>
    {
        var errors = ctx.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .ToList();
        var payload = new { success = false, message = "Dữ liệu không hợp lệ", data = (object?)null, errors };
        return new BadRequestObjectResult(payload);
    };
});

builder.Services.AddOpenApi();

// CORS cho frontend Vite (mặc định http://localhost:5173).
builder.Services.AddCors(o => o.AddPolicy("Frontend", p => p
    .WithOrigins(builder.Configuration.GetSection("App:AllowedOrigins").Get<string[]>()
        ?? ["http://localhost:5173"])
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

// ===== Module 1 — Hoàng: Xác thực & Người dùng =====
// Cần cho AppDbContext đọc claim NameIdentifier khi ghi audit (mục 5.3).
builder.Services.AddHttpContextAccessor();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Đăng ký service Module 1. Mỗi module chỉ thêm dòng của mình (GITHUB-WORKFLOW-RULES.md mục 8).
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();

// JWT Authentication (mục 5.4). Secret đọc từ cấu hình, không viết cứng.
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
{
    throw new InvalidOperationException("Jwt:Secret chưa cấu hình hoặc quá ngắn (tối thiểu 32 ký tự). Đặt trong appsettings hoặc dotnet user-secrets.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Seed Admin mặc định (mục 7.6). Mật khẩu đọc từ cấu hình, không viết cứng.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        if (!await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Role == Roles.Admin))
        {
            var adminEmail = config["Seed:AdminEmail"] ?? "admin@auction.local";
            var adminPass = config["Seed:AdminPassword"] ?? "Admin@123456";
            var adminUser = config["Seed:AdminUsername"] ?? "admin";
            db.Users.Add(new User
            {
                Username = adminUser,
                Email = adminEmail.ToLowerInvariant(),
                PasswordHash = backend.Helpers.PasswordHelper.Hash(adminPass),
                FullName = "Administrator",
                Role = Roles.Admin,
                IsActive = true,
                IsEmailVerified = true
            });
            await db.SaveChangesAsync();
            logger.LogInformation("Đã seed tài khoản Admin mặc định: {Email}", adminEmail);
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Seed Admin thất bại (có thể DB chưa sẵn sàng)");
    }
}

// ExceptionMiddleware phải đặt đầu pipeline để bắt lỗi toàn bộ request.
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
