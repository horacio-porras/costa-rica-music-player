using System.ComponentModel.DataAnnotations;

namespace CostaRicaMusicBLL.Dtos
{
    public class LoginDto
    {
        [Required(ErrorMessage = "El correo o usuario es obligatorio")]
        public string EmailOrUsername { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contrasena es obligatoria")]
        public string Password { get; set; } = string.Empty;
    }
}
