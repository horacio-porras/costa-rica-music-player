using System;

namespace CostaRicaMusicDAL.Entidades;

public partial class PlaylistSong
{
    public int PlaylistId { get; set; }

    public int SongId { get; set; }

    public DateTime AddedAt { get; set; }

    public virtual Playlist Playlist { get; set; } = null!;

    public virtual Song Song { get; set; } = null!;
}

