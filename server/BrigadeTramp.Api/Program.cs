using BrigadeTramp.Api.Auth;
using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.Endpoints;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

var connStr = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Missing connection string 'Default'");
var isSqlite = connStr.Contains("Data Source=", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<AppDbContext>(opts =>
{
    if (isSqlite) opts.UseSqlite(connStr);
    else opts.UseSqlServer(connStr);
});

builder.Services.AddAuthentication("BasicAuth")
    .AddScheme<BasicAuthOptions, BasicAuthHandler>("BasicAuth", null);
builder.Services.AddAuthorization();

builder.Services.AddOpenApi();

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // Schema patches — run idempotently; catch if the column already exists
    var patches = isSqlite
        ? new[]
        {
            "ALTER TABLE Singers ADD COLUMN Code TEXT NOT NULL DEFAULT ''",
            "ALTER TABLE Singers ADD COLUMN Status TEXT NOT NULL DEFAULT 'Active'",
        }
        : new[]
        {
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='Code') ALTER TABLE Singers ADD Code NVARCHAR(10) NOT NULL DEFAULT ''",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='Status') ALTER TABLE Singers ADD Status NVARCHAR(10) NOT NULL DEFAULT 'Active'",
        };

    foreach (var sql in patches)
    {
        try { db.Database.ExecuteSqlRaw(sql); }
        catch { /* column already exists */ }
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
    app.UseCors();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapSingerEndpoints();
app.MapEventEndpoints();
app.MapImportEndpoints();
app.MapQrPdfEndpoints();

app.Run();
