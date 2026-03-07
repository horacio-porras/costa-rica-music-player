using System.ComponentModel.DataAnnotations;

namespace CostaRicaMusicBLL.Dtos
{
    public class ArtistDto
    {
        public int ArtistId { get; set; }

        [Required(ErrorMessage = "El nombre del artista es obligatorio")]
        public string Name { get; set; }

        public string? Biography { get; set; }

        public string? ImageUrl { get; set; }
    }
}

