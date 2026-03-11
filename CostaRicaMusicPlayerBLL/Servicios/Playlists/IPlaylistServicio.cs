using CostaRicaMusicBLL.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace CostaRicaMusicBLL.Servicios.Playlists
{
    public interface IPlaylistServicio
    {
        Task<CustomResponse<List<PlaylistDto>>> ObtenerPlaylistsAsync();
        Task<CustomResponse<PlaylistDto>> ObtenerPlaylistPorIdAsync(int id);
        Task<CustomResponse<PlaylistDetailDto>> ObtenerDetallePlaylistAsync(int id);
        Task<CustomResponse<bool>> EliminarCancionDePlaylistAsync(int playlistId, int songId);
        Task<CustomResponse<PlaylistDto>> AgregarPlaylistAsync(PlaylistDto playlistDto, IFormFile? imagenPortada = null);
        Task<CustomResponse<PlaylistDto>> ActualizarPlaylistAsync(PlaylistDto playlistDto, IFormFile? imagenPortada = null, bool eliminarImagen = false);
        Task<CustomResponse<PlaylistDto>> EliminarPlaylistAsync(int id);
    }
}

