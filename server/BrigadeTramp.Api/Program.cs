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
            "ALTER TABLE Singers ADD COLUMN Email TEXT NOT NULL DEFAULT ''",
            "CREATE TABLE IF NOT EXISTS Contests (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL DEFAULT '', EventId INTEGER NOT NULL)",
            "CREATE TABLE IF NOT EXISTS ContestQuartets (Id INTEGER PRIMARY KEY AUTOINCREMENT, ContestId INTEGER NOT NULL, Name TEXT NOT NULL DEFAULT '', Score REAL)",
            "ALTER TABLE ContestQuartets ADD COLUMN Name TEXT NOT NULL DEFAULT ''",
            "ALTER TABLE ContestQuartets ADD COLUMN Score2 REAL",
            "CREATE TABLE IF NOT EXISTS ContestQuartetSingers (QuartetId INTEGER NOT NULL, SingerId INTEGER NOT NULL, PRIMARY KEY (QuartetId, SingerId))",
        }
        : new[]
        {
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='Code') ALTER TABLE Singers ADD Code NVARCHAR(10) NOT NULL DEFAULT ''",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='Status') ALTER TABLE Singers ADD Status NVARCHAR(10) NOT NULL DEFAULT 'Active'",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='Email') ALTER TABLE Singers ADD Email NVARCHAR(254) NOT NULL DEFAULT ''",
            "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Contests') CREATE TABLE Contests (Id INT IDENTITY(1,1) PRIMARY KEY, Name NVARCHAR(200) NOT NULL DEFAULT '', EventId INT NOT NULL)",
            "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='ContestQuartets') CREATE TABLE ContestQuartets (Id INT IDENTITY(1,1) PRIMARY KEY, ContestId INT NOT NULL, Name NVARCHAR(200) NOT NULL DEFAULT '', Score DECIMAL(8,2) NULL)",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('ContestQuartets') AND name='Name') ALTER TABLE ContestQuartets ADD Name NVARCHAR(200) NOT NULL DEFAULT ''",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('ContestQuartets') AND name='Score2') ALTER TABLE ContestQuartets ADD Score2 DECIMAL(8,2) NULL",
            "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='ContestQuartetSingers') CREATE TABLE ContestQuartetSingers (QuartetId INT NOT NULL, SingerId INT NOT NULL, PRIMARY KEY (QuartetId, SingerId))",
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
app.MapContestEndpoints();

app.Run();
