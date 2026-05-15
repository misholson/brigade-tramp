using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Endpoints;

public static class SongEndpoints
{
    public static void MapSongEndpoints(this WebApplication app)
    {
        app.MapGet("/api/singer/{code}/songs", async (string code, AppDbContext db) =>
        {
            var singer = await db.Singers.FirstOrDefaultAsync(s => s.Code == code);
            if (singer is null) return Results.NotFound();
            var songs = await db.Songs
                .Where(s => s.EventId == singer.EventId)
                .OrderBy(s => s.SortOrder)
                .Select(s => s.Title)
                .ToListAsync();
            return Results.Ok(songs);
        });

        app.MapGet("/api/events/{id:int}/songs", async (int id, AppDbContext db) =>
        {
            var songs = await db.Songs
                .Where(s => s.EventId == id)
                .OrderBy(s => s.SortOrder)
                .Select(s => s.Title)
                .ToListAsync();
            return Results.Ok(songs);
        }).RequireAuthorization();

        app.MapPut("/api/events/{id:int}/songs", async (int id, SetSongsDto dto, AppDbContext db) =>
        {
            var existing = await db.Songs.Where(s => s.EventId == id).ToListAsync();
            db.Songs.RemoveRange(existing);
            var songs = dto.Titles
                .Select((title, i) => new Song { EventId = id, Title = title, SortOrder = i })
                .ToList();
            db.Songs.AddRange(songs);
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();
    }
}
