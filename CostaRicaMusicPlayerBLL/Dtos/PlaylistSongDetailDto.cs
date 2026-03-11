namespace CostaRicaMusicBLL.Dtos
{
    public class PlaylistSongDetailDto
    {
        public int SongId { get; set; }
        public int TrackNumber { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ArtistName { get; set; } = "Artista desconocido";
        public string AlbumTitle { get; set; } = "Single";
        public int DurationSeconds { get; set; }
        public string CoverImageUrl { get; set; } = "/img/placeholder-cover.png";
    }
}
