using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Endpoints;

public static class StatsEndpoints
{
    static readonly string[] PartOrder = ["Tenor", "Lead", "Baritone", "Bass"];

    public static void MapStatsEndpoints(this WebApplication app)
    {
        app.MapGet("/api/events/{id:int}/stats", async (int id, AppDbContext db) =>
        {
            var ev = await db.Events.FindAsync(id);
            if (ev is null) return Results.NotFound();

            var allSingers = await db.Singers
                .Where(s => s.EventId == id && s.DanceCardStatus != DanceCardStatus.Hidden)
                .ToListAsync();

            var singerIds = allSingers.Select(s => s.Id).ToHashSet();
            var allSungWith = await db.SingerSungWiths
                .Where(sw => singerIds.Contains(sw.SingerId))
                .ToListAsync();

            var sungWithLookup = allSungWith
                .GroupBy(sw => sw.SingerId)
                .ToDictionary(g => g.Key, g => g.Select(sw => sw.SungWithSingerId).ToHashSet());

            var sungWithTwiceLookup = allSungWith
                .GroupBy(sw => sw.SingerId)
                .ToDictionary(g => g.Key, g => g.Where(sw => sw.Count >= 2).Select(sw => sw.SungWithSingerId).ToHashSet());

            var requiredSingers = allSingers.Where(s => s.DanceCardStatus == DanceCardStatus.Required).ToList();

            // Distinct parts present at the event
            var presentParts = allSingers.Select(s => s.Part).Distinct().ToHashSet();

            var tramps = new List<AchieverDto>();
            var superTramps = new List<AchieverDto>();
            var busyBees = new List<AchieverDto>();
            var closeToTramp = new List<AchieverDto>();
            var closeToSuperTramp = new List<AchieverDto>();
            var closeToBusyBee = new List<AchieverDto>();

            // (sum of progress ratios, count of singers with at least one required other-part singer)
            var partProgressBuckets = PartOrder.ToDictionary(p => p, _ => (sum: 0.0, count: 0));

            int appUsers = 0;
            int trampCount = 0;

            foreach (var singer in allSingers)
            {
                var sungWith = sungWithLookup.GetValueOrDefault(singer.Id, []);
                var sungWithTwice = sungWithTwiceLookup.GetValueOrDefault(singer.Id, []);
                var partStr = singer.Part.ToString();

                var requiredOtherPart = requiredSingers
                    .Where(s => s.Id != singer.Id && s.Part != singer.Part)
                    .ToList();

                var requiredAll = requiredSingers
                    .Where(s => s.Id != singer.Id)
                    .ToList();

                bool isTramp = requiredOtherPart.Count > 0 && requiredOtherPart.All(s => sungWith.Contains(s.Id));
                if (isTramp)
                {
                    tramps.Add(new AchieverDto(singer.Id, singer.BadgeName, singer.LastName, partStr));
                    trampCount++;
                }
                else if (requiredOtherPart.Count > 0)
                {
                    // Close to Tramp: 3 or fewer required singers remaining in every other part
                    bool close = presentParts
                        .Where(p => p != singer.Part)
                        .All(p => requiredOtherPart.Count(s => s.Part == p && !sungWith.Contains(s.Id)) <= 3);
                    if (close)
                        closeToTramp.Add(new AchieverDto(singer.Id, singer.BadgeName, singer.LastName, partStr));
                }

                bool isSuperTramp = requiredAll.Count > 0 && requiredAll.All(s => sungWith.Contains(s.Id));
                if (isSuperTramp)
                {
                    superTramps.Add(new AchieverDto(singer.Id, singer.BadgeName, singer.LastName, partStr));
                }
                else if (isTramp)
                {
                    // Close to Super Tramp: achieved Tramp but ≤3 required own-part singers remaining
                    var remainingOwnPart = requiredSingers.Count(s => s.Part == singer.Part && s.Id != singer.Id && !sungWith.Contains(s.Id));
                    if (remainingOwnPart <= 3)
                        closeToSuperTramp.Add(new AchieverDto(singer.Id, singer.BadgeName, singer.LastName, partStr));
                }

                bool isBusyBee = ev.AllowBusyBee && requiredOtherPart.Count > 0 && requiredOtherPart.All(s => sungWithTwice.Contains(s.Id));
                if (isBusyBee)
                {
                    busyBees.Add(new AchieverDto(singer.Id, singer.BadgeName, singer.LastName, partStr));
                }
                else if (ev.AllowBusyBee && isTramp)
                {
                    // Close to Busy Bee: achieved Tramp but ≤3 required other-part singers not yet sung with twice
                    bool closeBusyBee = presentParts
                        .Where(p => p != singer.Part)
                        .All(p => requiredOtherPart.Count(s => s.Part == p && !sungWithTwice.Contains(s.Id)) <= 3);
                    if (closeBusyBee)
                        closeToBusyBee.Add(new AchieverDto(singer.Id, singer.BadgeName, singer.LastName, partStr));
                }

                // "Used the app": checked off at least one singer in every other part that exists at the event
                var otherParts = presentParts.Where(p => p != singer.Part).ToList();
                bool usedApp = otherParts.Count > 0 && otherParts.All(p =>
                    allSingers.Any(s => s.Part == p && sungWith.Contains(s.Id)));
                if (usedApp) appUsers++;

                if (requiredOtherPart.Count > 0)
                {
                    double progress = (double)requiredOtherPart.Count(s => sungWith.Contains(s.Id)) / requiredOtherPart.Count;
                    var (sum, cnt) = partProgressBuckets[partStr];
                    partProgressBuckets[partStr] = (sum + progress, cnt + 1);
                }
            }

            var partProgress = PartOrder
                .Where(p => partProgressBuckets[p].count > 0)
                .Select(p =>
                {
                    var (sum, cnt) = partProgressBuckets[p];
                    return new PartProgressDto(p, Math.Round(sum / cnt * 100, 1));
                })
                .ToList();

            return Results.Ok(new EventStatsDto(
                ev.Name,
                ev.AllowBusyBee,
                [.. tramps.OrderBy(a => a.BadgeName)],
                [.. superTramps.OrderBy(a => a.BadgeName)],
                [.. busyBees.OrderBy(a => a.BadgeName)],
                [.. closeToTramp.OrderBy(a => a.BadgeName)],
                [.. closeToSuperTramp.OrderBy(a => a.BadgeName)],
                [.. closeToBusyBee.OrderBy(a => a.BadgeName)],
                new EventNumbersDto(allSingers.Count, appUsers, trampCount, partProgress)
            ));
        });
    }
}
