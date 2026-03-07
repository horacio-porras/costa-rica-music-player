namespace CostaRicaMusicDAL.Entidades;

public partial class SongArtist
{
    public int SongId { get; set; }

    public int ArtistId { get; set; }

    public virtual Song Song { get; set; } = null!;

    public virtual Artist Artist { get; set; } = null!;
}

