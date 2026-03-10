using System.ComponentModel.DataAnnotations;

namespace CostaRicaMusicBLL.Dtos
{
    public class AlbumDto
    {
        public int AlbumId { get; set; }

        [Required(ErrorMessage = "El título del álbum es obligatorio")]
        public string Title { get; set; }

        public int? ReleaseYear { get; set; }

        [Required(ErrorMessage = "El artista del álbum es obligatorio")]
        public int ArtistId { get; set; }

        public string? CoverImageUrl { get; set; }
    }
}

