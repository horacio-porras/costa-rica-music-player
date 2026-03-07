using System.Collections.Generic;

namespace CostaRicaMusicDAL.Entidades;

public partial class Song
{
    public int SongId { get; set; }

    public string Title { get; set; } = null!;

    public int? Duration { get; set; }

    public string FilePath { get; set; } = null!;

    public int? AlbumId { get; set; }

    public virtual Album? Album { get; set; }

    public string? CoverImageUrl { get; set; }

    public virtual ICollection<SongArtist> SongArtists { get; set; } = new List<SongArtist>();

    public virtual ICollection<PlaylistSong> PlaylistSongs { get; set; } = new List<PlaylistSong>();
}

