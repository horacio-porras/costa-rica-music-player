using CostaRicaMusicBLL.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace CostaRicaMusicBLL.Servicios.Playlists
{
    public interface IPlaylistServicio
    {
        Task<CustomResponse<List<PlaylistDto>>> ObtenerPlaylistsAsync(int userId);
        Task<CustomResponse<PlaylistDto>> ObtenerPlaylistPorIdAsync(int id, int userId);
        Task<CustomResponse<PlaylistDetailDto>> ObtenerDetallePlaylistAsync(int id, int userId);
        Task<CustomResponse<bool>> AgregarCancionAPlaylistAsync(int playlistId, int songId, int userId);
        Task<CustomResponse<bool>> EliminarCancionDePlaylistAsync(int playlistId, int songId, int userId);
        Task<CustomResponse<PlaylistDto>> AgregarPlaylistAsync(PlaylistDto playlistDto, IFormFile? imagenPortada = null, int userId = 0);
        Task<CustomResponse<PlaylistDto>> ActualizarPlaylistAsync(PlaylistDto playlistDto, IFormFile? imagenPortada = null, bool eliminarImagen = false, int userId = 0);
        Task<CustomResponse<PlaylistDto>> EliminarPlaylistAsync(int id, int userId);
    }
}

