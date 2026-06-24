using System.Globalization;
using System.Security.Cryptography;
using BrigadeTramp.Api.Auth;
using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Endpoints;

public static class ImportEndpoints
{
    public static void MapImportEndpoints(this WebApplication app)
    {
        app.MapPost("/api/events/{id:int}/import", async (int id, HttpRequest request, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.CanManageEvent(ctx.User, id)) return Results.Forbid();

            var ev = await db.Events.FindAsync(id);
            if (ev is null) return Results.NotFound();

            string csvText;
            using (var reader = new StreamReader(request.Body))
                csvText = await reader.ReadToEndAsync();

            if (string.IsNullOrWhiteSpace(csvText))
                return Results.BadRequest("CSV body is empty");

            var csvConfig = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                TrimOptions = TrimOptions.Trim,
                MissingFieldFound = null,
                BadDataFound = null,
            };

            List<ImportRowDto> rows;
            using (var stringReader = new StringReader(csvText))
            using (var csv = new CsvReader(stringReader, csvConfig))
                rows = csv.GetRecords<ImportRowDto>().ToList();

            var existingCodes = await db.Singers
                .Where(s => s.EventId == id)
                .Select(s => s.Code)
                .ToHashSetAsync();

            var singers = rows
                .Where(r => !string.IsNullOrWhiteSpace(r.BadgeName))
                .Select(row =>
                {
                    var part = Enum.TryParse<Part>(row.Part, ignoreCase: true, out var parsed) ? parsed : Part.Lead;
                    var danceCardStatus = row.Status.Equals("Inactive", StringComparison.OrdinalIgnoreCase) ? DanceCardStatus.Hidden
                        : row.Status.Equals("Optional", StringComparison.OrdinalIgnoreCase) ? DanceCardStatus.Optional
                        : DanceCardStatus.Required;
                    return new Singer
                    {
                        BadgeName = row.BadgeName,
                        FirstName = row.FirstName,
                        LastName = row.LastName,
                        Part = part,
                        Email = row.Email,
                        DanceCardStatus = danceCardStatus,
                        ContestStatus = ContestStatus.Included,
                        EventId = id,
                        Code = GenerateUniqueCode(existingCodes),
                    };
                })
                .ToList();

            db.Singers.AddRange(singers);
            await db.SaveChangesAsync();

            return Results.Ok(new { imported = singers.Count });
        }).RequireAuthorization();
    }

    static string GenerateUniqueCode(HashSet<string> existing)
    {
        string code;
        do { code = new string(RandomNumberGenerator.GetItems("abcdefghijklmnopqrstuvwxyz0123456789".AsSpan(), 8)); }
        while (existing.Contains(code));
        existing.Add(code);
        return code;
    }
}
