using System;
using System.Collections.Generic;
using CostaRicaMusicDAL.Entidades;
using Microsoft.EntityFrameworkCore;

namespace CostaRicaMusicDAL.Data;

public partial class CostaRicaMusicDbContext : DbContext
{
    public CostaRicaMusicDbContext()
    {
    }

    public CostaRicaMusicDbContext(DbContextOptions<CostaRicaMusicDbContext> options)
        : base(options)
    {
    }
    public virtual DbSet<Artist> Artists { get; set; }
    public virtual DbSet<Album> Albums { get; set; }
    public virtual DbSet<Song> Songs { get; set; }
    public virtual DbSet<SongArtist> SongArtists { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Playlist> Playlists { get; set; }
    public virtual DbSet<PlaylistSong> PlaylistSongs { get; set; }

    /*protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlite("Data Source=C:\\Users\\richa\\Downloads\\DB.Browser.for.SQLite-v3.13.1-win64 (2)\\CarroDB.db");
    */
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        
        modelBuilder.Entity<Artist>(entity =>
        {
            entity.HasKey(e => e.ArtistId);

            entity.Property(e => e.Name)
                  .IsRequired();
        });

        modelBuilder.Entity<Album>(entity =>
        {
            entity.HasKey(e => e.AlbumId);

            entity.Property(e => e.Title)
                  .IsRequired();

            entity.HasOne(e => e.Artist)
                  .WithMany(a => a.Albums)
                  .HasForeignKey(e => e.ArtistId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Song>(entity =>
        {
            entity.HasKey(e => e.SongId);

            entity.Property(e => e.Title)
                  .IsRequired();

            entity.Property(e => e.FilePath)
                  .IsRequired();

            entity.HasOne(e => e.Album)
                  .WithMany(a => a.Songs)
                  .HasForeignKey(e => e.AlbumId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SongArtist>(entity =>
        {
            entity.HasKey(e => new { e.SongId, e.ArtistId });

            entity.HasOne(e => e.Song)
                  .WithMany(s => s.SongArtists)
                  .HasForeignKey(e => e.SongId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Artist)
                  .WithMany(a => a.SongArtists)
                  .HasForeignKey(e => e.ArtistId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);

            entity.Property(e => e.Username)
                  .IsRequired();

            entity.Property(e => e.Email)
                  .IsRequired();

            entity.Property(e => e.PasswordHash)
                  .IsRequired();
        });

        modelBuilder.Entity<Playlist>(entity =>
        {
            entity.HasKey(e => e.PlaylistId);

            entity.Property(e => e.Name)
                  .IsRequired();

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Playlists)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PlaylistSong>(entity =>
        {
            entity.HasKey(e => new { e.PlaylistId, e.SongId });

            entity.HasOne(e => e.Playlist)
                  .WithMany(p => p.PlaylistSongs)
                  .HasForeignKey(e => e.PlaylistId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Song)
                  .WithMany(s => s.PlaylistSongs)
                  .HasForeignKey(e => e.SongId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
