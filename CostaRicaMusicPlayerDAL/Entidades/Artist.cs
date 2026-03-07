using System.Collections.Generic;

namespace CostaRicaMusicDAL.Entidades;

public partial class Artist
{
    public int ArtistId { get; set; }

    public string Name { get; set; } = null!;

    public string? Biography { get; set; }

    public string? ImageUrl { get; set; }

    public virtual ICollection<Album> Albums { get; set; } = new List<Album>();

    public virtual ICollection<SongArtist> SongArtists { get; set; } = new List<SongArtist>();
}

