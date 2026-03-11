using System.Collections.Generic;

namespace CostaRicaMusicBLL.Dtos
{
    public class PlaylistDetailDto
    {
        public int PlaylistId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string Username { get; set; } = "Usuario";
        public string? CoverImageUrl { get; set; }
        public int SongCount { get; set; }
        public int TotalDurationSeconds { get; set; }
        public List<string> HeaderCollageImages { get; set; } = new();
        public List<PlaylistSongDetailDto> Songs { get; set; } = new();
    }
}
