using System;
using System.Collections.Generic;
using System.Text;

namespace CostaRicaMusicBLL.Dtos
{
    public class SongDetailDto
    {
        public int SongId { get; set; }
        public string Title { get; set; }
        public int? Duration { get; set; }
        public string FilePath { get; set; }
        public int? AlbumId { get; set; }

        public string? CoverImageUrl { get; set; }

        // Datos de álbum / artista para la UI
        public string? AlbumTitle { get; set; }
        public string? AlbumCoverImageUrl { get; set; }
        public int? AlbumReleaseYear { get; set; }
        public string? ArtistName { get; set; }
        public string? ArtistImageUrl { get; set; }
        public int? ArtistId { get; set; }
        public string? ArtistBiography { get; set; }
    }
}
