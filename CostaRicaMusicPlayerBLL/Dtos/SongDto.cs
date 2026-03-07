using System.ComponentModel.DataAnnotations;

namespace CostaRicaMusicBLL.Dtos
{
    public class SongDto
    {
        public int SongId { get; set; }

        [Required(ErrorMessage = "El título de la canción es obligatorio")]
        public string Title { get; set; }

        public int? Duration { get; set; }

        [Required(ErrorMessage = "La ruta del archivo es obligatoria")]
        public string FilePath { get; set; }

        public int? AlbumId { get; set; }

        public string? CoverImageUrl { get; set; }
    }
}

