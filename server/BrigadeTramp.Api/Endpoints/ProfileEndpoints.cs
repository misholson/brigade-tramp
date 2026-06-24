using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Endpoints;

public static class ProfileEndpoints
{
    public static void MapProfileEndpoints(this WebApplication app)
    {
        app.MapGet("/api/singer/{code}/profile", async (string code, AppDbContext db) =>
        {
            var singer = await db.Singers.FirstOrDefaultAsync(s => s.Code == code);
            if (singer is null) return Results.NotFound();
            return Results.Ok(new SingerProfileDto(singer.PhotoUrl, singer.ShowEmail));
        });

        app.MapPut("/api/singer/{code}/profile", async (string code, UpdateProfileDto dto, AppDbContext db) =>
        {
            var singer = await db.Singers.FirstOrDefaultAsync(s => s.Code == code);
            if (singer is null) return Results.NotFound();
            singer.ShowEmail = dto.ShowEmail;
            await db.SaveChangesAsync();
            return Results.Ok(new SingerProfileDto(singer.PhotoUrl, singer.ShowEmail));
        });

        app.MapPost("/api/singer/{code}/photo", async (string code, IFormFile file, AppDbContext db, IConfiguration config) =>
        {
            var singer = await db.Singers.FirstOrDefaultAsync(s => s.Code == code);
            if (singer is null) return Results.NotFound();

            var containerUrl = config["BlobStorageContainer"];
            if (string.IsNullOrWhiteSpace(containerUrl))
                return Results.Problem("Blob storage is not configured.", statusCode: 503);

            var containerClient = new BlobContainerClient(new Uri(containerUrl), new DefaultAzureCredential());
            var blobName = $"event-{singer.EventId}/{singer.Id}";
            var blobClient = containerClient.GetBlobClient(blobName);

            await using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders { ContentType = file.ContentType }
            });

            singer.PhotoUrl = blobClient.Uri.ToString();
            await db.SaveChangesAsync();
            return Results.Ok(new SingerProfileDto(singer.PhotoUrl, singer.ShowEmail));
        }).DisableAntiforgery();
    }
}
