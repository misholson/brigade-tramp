using BrigadeTramp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Singer> Singers => Set<Singer>();
    public DbSet<SingerSungWith> SingerSungWiths => Set<SingerSungWith>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SingerSungWith>()
            .HasKey(s => new { s.SingerId, s.SungWithSingerId });

        modelBuilder.Entity<Singer>()
            .HasIndex(s => s.Code)
            .IsUnique();

        modelBuilder.Entity<Singer>()
            .Property(s => s.Part)
            .HasConversion<string>();

        modelBuilder.Entity<Singer>()
            .Property(s => s.Status)
            .HasConversion<string>();
    }
}
