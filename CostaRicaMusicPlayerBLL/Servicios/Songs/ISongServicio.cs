using CostaRicaMusicBLL.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CostaRicaMusicBLL.Servicios.Songs
{
    public interface ISongServicio
    {
        Task<CustomResponse<List<SongDto>>> ObtenerSongsAsync();

        // Devuelve canciones con información de álbum y artista para la UI
        Task<CustomResponse<List<CostaRicaMusicBLL.Dtos.SongDetailDto>>> ObtenerSongsConDetallesAsync();

        Task<CustomResponse<SongDto>> ObtenerSongPorIdAsync(int id);

        Task<CustomResponse<SongDto>> AgregarSongAsync(SongDto songDto);

        Task<CustomResponse<SongDto>> ActualizarSongAsync(SongDto songDto);

        Task<CustomResponse<SongDto>> EliminarSongAsync(int id);
    }
}

