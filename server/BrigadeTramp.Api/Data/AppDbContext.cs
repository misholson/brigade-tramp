using BrigadeTramp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Singer> Singers => Set<Singer>();
    public DbSet<SingerSungWith> SingerSungWiths => Set<SingerSungWith>();
    public DbSet<Song> Songs => Set<Song>();
    public DbSet<Contest> Contests => Set<Contest>();
    public DbSet<ContestQuartet> ContestQuartets => Set<ContestQuartet>();
    public DbSet<ContestQuartetSinger> ContestQuartetSingers => Set<ContestQuartetSinger>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SingerSungWith>()
            .HasKey(s => new { s.SingerId, s.SungWithSingerId });

        modelBuilder.Entity<ContestQuartetSinger>()
            .HasKey(x => new { x.QuartetId, x.SingerId });

        modelBuilder.Entity<ContestQuartetSinger>()
            .HasOne(x => x.Quartet)
            .WithMany(x => x.SingerLinks)
            .HasForeignKey(x => x.QuartetId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ContestQuartetSinger>()
            .HasOne(x => x.Singer)
            .WithMany()
            .HasForeignKey(x => x.SingerId)
            .OnDelete(DeleteBehavior.Restrict);

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
