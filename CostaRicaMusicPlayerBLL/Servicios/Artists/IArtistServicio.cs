using CostaRicaMusicBLL.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CostaRicaMusicBLL.Servicios.Artists
{
    public interface IArtistServicio
    {
        Task<CustomResponse<List<ArtistDto>>> ObtenerArtistsAsync();

        Task<CustomResponse<ArtistDto>> ObtenerArtistPorIdAsync(int id);

        Task<CustomResponse<ArtistDto>> AgregarArtistAsync(ArtistDto artistDto);

        Task<CustomResponse<ArtistDto>> ActualizarArtistAsync(ArtistDto artistDto);

        Task<CustomResponse<ArtistDto>> EliminarArtistAsync(int id);
    }
}

