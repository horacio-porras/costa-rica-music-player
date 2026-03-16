using CostaRicaMusicBLL.Dtos;
using System.Threading.Tasks;

namespace CostaRicaMusicBLL.Servicios.Auth
{
    public interface IAuthServicio
    {
        Task<CustomResponse<AuthUserDto>> LoginAsync(LoginDto loginDto);
        Task<CustomResponse<AuthUserDto>> RegisterAsync(RegisterDto registerDto);
    }
}
