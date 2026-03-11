using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace CostaRicaMusicBLL.Dtos
{
    public class PlaylistDto
    {
        public int PlaylistId { get; set; }
        [Required(ErrorMessage = "El nombre de la playlist es obligatorio")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "El usuario es obligatorio")]
        public int UserId { get; set; }
        public string? CoverImageUrl { get; set; }

        // Propiedad para el conteo de canciones 
        public int SongCount { get; set; }
        public List<string> ThumbnailImages { get; set; } = new();

    }
}

