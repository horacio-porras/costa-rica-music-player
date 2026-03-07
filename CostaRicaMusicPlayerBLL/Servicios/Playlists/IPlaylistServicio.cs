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
        Task<CustomResponse<PlaylistDto>> AgregarPlaylistAsync(PlaylistDto playlistDto, IFormFile? imagenPortada = null);
        Task<CustomResponse<PlaylistDto>> ActualizarPlaylistAsync(PlaylistDto playlistDto, IFormFile? imagenPortada = null);
        Task<CustomResponse<PlaylistDto>> EliminarPlaylistAsync(int id);
    }
}

