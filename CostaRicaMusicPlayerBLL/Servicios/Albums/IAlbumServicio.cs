using CostaRicaMusicBLL.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CostaRicaMusicBLL.Servicios.Albums
{
    public interface IAlbumServicio
    {
        Task<CustomResponse<List<AlbumDto>>> ObtenerAlbumsAsync();

        Task<CustomResponse<AlbumDto>> ObtenerAlbumPorIdAsync(int id);

        Task<CustomResponse<AlbumDto>> AgregarAlbumAsync(AlbumDto albumDto);

        Task<CustomResponse<AlbumDto>> ActualizarAlbumAsync(AlbumDto albumDto);

        Task<CustomResponse<AlbumDto>> EliminarAlbumAsync(int id);
    }
}

