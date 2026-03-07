using System.Collections.Generic;

namespace CostaRicaMusicDAL.Entidades;

public partial class Playlist
{
    public int PlaylistId { get; set; }

    public string Name { get; set; } = null!;

    public int UserId { get; set; }

    public virtual User User { get; set; } = null!;

    public string? CoverImageUrl { get; set; }

    public virtual ICollection<PlaylistSong> PlaylistSongs { get; set; } = new List<PlaylistSong>();
}

