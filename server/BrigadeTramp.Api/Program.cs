using System.Text;
using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.Endpoints;
using BrigadeTramp.Api.Models;
using BrigadeTramp.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PdfSharp.Fonts;
using Scalar.AspNetCore;

GlobalFontSettings.UseWindowsFontsUnderWindows = true;

var builder = WebApplication.CreateBuilder(args);

var connStr = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Missing connection string 'Default'");
var isSqlite = connStr.Contains("Data Source=", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<AppDbContext>(opts =>
{
    if (isSqlite) opts.UseSqlite(connStr);
    else opts.UseSqlServer(connStr);
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!);
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddSingleton<EmailService>();
builder.Services.AddSingleton<JwtService>();

builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p => p
        .WithOrigins(allowedOrigins)
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
            "CREATE TABLE IF NOT EXISTS Songs (Id INTEGER PRIMARY KEY AUTOINCREMENT, EventId INTEGER NOT NULL, Title TEXT NOT NULL DEFAULT '', SortOrder INTEGER NOT NULL DEFAULT 0)",
            "CREATE TABLE IF NOT EXISTS Contests (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL DEFAULT '', EventId INTEGER NOT NULL)",
            "CREATE TABLE IF NOT EXISTS ContestQuartets (Id INTEGER PRIMARY KEY AUTOINCREMENT, ContestId INTEGER NOT NULL, Name TEXT NOT NULL DEFAULT '', Score REAL)",
            "ALTER TABLE ContestQuartets ADD COLUMN Name TEXT NOT NULL DEFAULT ''",
            "ALTER TABLE ContestQuartets ADD COLUMN Score2 REAL",
            "ALTER TABLE ContestQuartets ADD COLUMN SongTitle TEXT",
            "CREATE TABLE IF NOT EXISTS ContestQuartetSingers (QuartetId INTEGER NOT NULL, SingerId INTEGER NOT NULL, PRIMARY KEY (QuartetId, SingerId))",
            "ALTER TABLE Contests ADD COLUMN Round2Count INTEGER",
            "ALTER TABLE ContestQuartets ADD COLUMN Song2Title TEXT",
            "ALTER TABLE Events ADD COLUMN AllowBusyBee INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE SingerSungWiths ADD COLUMN Count INTEGER NOT NULL DEFAULT 1",
            "ALTER TABLE ContestQuartets ADD COLUMN SortOrder INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE ContestQuartets ADD COLUMN SortOrder2 INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE Events ADD COLUMN EmailFooter TEXT NOT NULL DEFAULT ''",
            "ALTER TABLE Events ADD COLUMN EndDate TEXT",
            "ALTER TABLE Contests ADD COLUMN ShowToSingers INTEGER NOT NULL DEFAULT 1",
            "ALTER TABLE Singers ADD COLUMN DanceCardStatus TEXT NOT NULL DEFAULT 'Required'",
            "ALTER TABLE Singers ADD COLUMN ContestStatus TEXT NOT NULL DEFAULT 'Included'",
            "ALTER TABLE Singers ADD COLUMN PhotoUrl TEXT",
            "ALTER TABLE Singers ADD COLUMN ShowEmail INTEGER NOT NULL DEFAULT 0",
        }
        : new[]
        {
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='Code') ALTER TABLE Singers ADD Code NVARCHAR(10) NOT NULL DEFAULT ''",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='Status') ALTER TABLE Singers ADD Status NVARCHAR(10) NOT NULL DEFAULT 'Active'",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='Email') ALTER TABLE Singers ADD Email NVARCHAR(254) NOT NULL DEFAULT ''",
            "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Songs') CREATE TABLE Songs (Id INT IDENTITY(1,1) PRIMARY KEY, EventId INT NOT NULL, Title NVARCHAR(500) NOT NULL DEFAULT '', SortOrder INT NOT NULL DEFAULT 0)",
            "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Contests') CREATE TABLE Contests (Id INT IDENTITY(1,1) PRIMARY KEY, Name NVARCHAR(200) NOT NULL DEFAULT '', EventId INT NOT NULL)",
            "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='ContestQuartets') CREATE TABLE ContestQuartets (Id INT IDENTITY(1,1) PRIMARY KEY, ContestId INT NOT NULL, Name NVARCHAR(200) NOT NULL DEFAULT '', Score DECIMAL(8,2) NULL)",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('ContestQuartets') AND name='Name') ALTER TABLE ContestQuartets ADD Name NVARCHAR(200) NOT NULL DEFAULT ''",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('ContestQuartets') AND name='Score2') ALTER TABLE ContestQuartets ADD Score2 DECIMAL(8,2) NULL",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('ContestQuartets') AND name='SongTitle') ALTER TABLE ContestQuartets ADD SongTitle NVARCHAR(500) NULL",
            "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='ContestQuartetSingers') CREATE TABLE ContestQuartetSingers (QuartetId INT NOT NULL, SingerId INT NOT NULL, PRIMARY KEY (QuartetId, SingerId))",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Contests') AND name='Round2Count') ALTER TABLE Contests ADD Round2Count INT NULL",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('ContestQuartets') AND name='Song2Title') ALTER TABLE ContestQuartets ADD Song2Title NVARCHAR(500) NULL",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Events') AND name='AllowBusyBee') ALTER TABLE Events ADD AllowBusyBee BIT NOT NULL DEFAULT 0",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('SingerSungWiths') AND name='Count') ALTER TABLE SingerSungWiths ADD Count INT NOT NULL DEFAULT 1",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('ContestQuartets') AND name='SortOrder') ALTER TABLE ContestQuartets ADD SortOrder INT NOT NULL DEFAULT 0",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('ContestQuartets') AND name='SortOrder2') ALTER TABLE ContestQuartets ADD SortOrder2 INT NOT NULL DEFAULT 0",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Events') AND name='EmailFooter') ALTER TABLE Events ADD EmailFooter NVARCHAR(MAX) NOT NULL DEFAULT ''",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Events') AND name='EndDate') ALTER TABLE Events ADD EndDate DATE NULL",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Contests') AND name='ShowToSingers') ALTER TABLE Contests ADD ShowToSingers BIT NOT NULL DEFAULT 1",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='DanceCardStatus') ALTER TABLE Singers ADD DanceCardStatus NVARCHAR(20) NOT NULL DEFAULT 'Required'",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='ContestStatus') ALTER TABLE Singers ADD ContestStatus NVARCHAR(20) NOT NULL DEFAULT 'Included'",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='PhotoUrl') ALTER TABLE Singers ADD PhotoUrl NVARCHAR(500) NULL",
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Singers') AND name='ShowEmail') ALTER TABLE Singers ADD ShowEmail BIT NOT NULL DEFAULT 0",
        };

    foreach (var sql in patches)
    {
        try { db.Database.ExecuteSqlRaw(sql); }
        catch { /* column already exists */ }
    }

    var userPatches = isSqlite
        ? new[]
        {
            "CREATE TABLE IF NOT EXISTS Users (Id INTEGER PRIMARY KEY AUTOINCREMENT, Email TEXT NOT NULL DEFAULT '', Name TEXT NOT NULL DEFAULT '', IsSiteAdmin INTEGER NOT NULL DEFAULT 0)",
            "CREATE TABLE IF NOT EXISTS UserEventRoles (UserId INTEGER NOT NULL, EventId INTEGER NOT NULL, Role TEXT NOT NULL DEFAULT '', PRIMARY KEY (UserId, EventId, Role))",
        }
        : new[]
        {
            "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Users') CREATE TABLE Users (Id INT IDENTITY(1,1) PRIMARY KEY, Email NVARCHAR(254) NOT NULL DEFAULT '', Name NVARCHAR(200) NOT NULL DEFAULT '', IsSiteAdmin BIT NOT NULL DEFAULT 0)",
            "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='UserEventRoles') CREATE TABLE UserEventRoles (UserId INT NOT NULL, EventId INT NOT NULL, Role NVARCHAR(50) NOT NULL DEFAULT '', PRIMARY KEY (UserId, EventId, Role))",
        };

    foreach (var sql in userPatches)
    {
        try { db.Database.ExecuteSqlRaw(sql); }
        catch { /* table already exists */ }
    }

    if (!db.Users.Any(u => u.Email == "mish.olson@gmail.com"))
    {
        db.Users.Add(new User { Email = "mish.olson@gmail.com", Name = "Mike Olson", IsSiteAdmin = true });
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapSingerEndpoints();
app.MapEventEndpoints();
app.MapImportEndpoints();
app.MapQrPdfEndpoints();
app.MapContestEndpoints();
app.MapSongEndpoints();
app.MapUserEndpoints();
app.MapStatsEndpoints();
app.MapProfileEndpoints();
app.MapPdfMergeEndpoints();

app.Run();
