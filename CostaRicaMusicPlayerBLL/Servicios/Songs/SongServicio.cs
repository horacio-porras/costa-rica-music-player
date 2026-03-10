using AutoMapper;
using CostaRicaMusicBLL;
using CostaRicaMusicBLL.Dtos;
using CostaRicaMusicDAL.Repositorios.Generico;
using System.Collections.Generic;
using System.Threading.Tasks;
using CostaRicaMusicDAL.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace CostaRicaMusicBLL.Servicios.Songs
{
    public class SongServicio : ISongServicio
    {
        private readonly IMapper _mapper;
        private readonly IRepositorioGenerico<CostaRicaMusicDAL.Entidades.Song> _repositorioGenerico;
        private readonly CostaRicaMusicDbContext _context;

        public SongServicio(IMapper mapper, IRepositorioGenerico<CostaRicaMusicDAL.Entidades.Song> repositorioGenerico, CostaRicaMusicDbContext context)
        {
            _mapper = mapper;
            _repositorioGenerico = repositorioGenerico;
            _context = context;
        }

        public async Task<CustomResponse<SongDto>> ActualizarSongAsync(SongDto songDto)
        {
            var response = new CustomResponse<SongDto>();

            if (songDto is null)
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Song.Null;
                response.codigoStatus = 400;
                return response;
            }

            var songActualiza = _mapper.Map<CostaRicaMusicDAL.Entidades.Song>(songDto);
            _repositorioGenerico.ActualizarAsync(songActualiza);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = "Error al actualizar la canción en la base de datos.";
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<SongDto>> AgregarSongAsync(SongDto songDto)
        {
            var response = new CustomResponse<SongDto>();

            if (songDto is null)
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Song.Null;
                response.codigoStatus = 400;
                return response;
            }

            var songGuardar = _mapper.Map<CostaRicaMusicDAL.Entidades.Song>(songDto);
            _repositorioGenerico.AgregarAsync(songGuardar);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Song.ErrorGuardar;
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<SongDto>> EliminarSongAsync(int id)
        {
            var response = new CustomResponse<SongDto>();

            if (id is 0)
            {
                response.esCorrecto = false;
                response.mensaje = "El identificador de la canción no es válido.";
                response.codigoStatus = 400;
                return response;
            }

            _repositorioGenerico.EliminarAsync(id);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Song.ErrorEliminar;
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<SongDto>> ObtenerSongPorIdAsync(int id)
        {
            var response = new CustomResponse<SongDto>();

            var song = await _repositorioGenerico.ObtenerPorIdAsync(id);

            if (song is null)
            {
                response.esCorrecto = false;
                response.mensaje = "La canción no existe.";
                response.codigoStatus = 404;
                return response;
            }

            response.Data = _mapper.Map<SongDto>(song);
            return response;
        }

        public async Task<CustomResponse<List<SongDto>>> ObtenerSongsAsync()
        {
            var response = new CustomResponse<List<SongDto>>();
            response.Data = _mapper.Map<List<SongDto>>(await _repositorioGenerico.ObtenerTodosAsync());
            return response;
        }

        public async Task<CustomResponse<List<CostaRicaMusicBLL.Dtos.SongDetailDto>>> ObtenerSongsConDetallesAsync()
        {
            var response = new CustomResponse<List<CostaRicaMusicBLL.Dtos.SongDetailDto>>();

            var songs = await _context.Songs
                .Include(s => s.Album)
                    .ThenInclude(a => a.Artist)
                .Select(s => new CostaRicaMusicBLL.Dtos.SongDetailDto
                {
                    SongId = s.SongId,
                    Title = s.Title,
                    Duration = s.Duration,
                    FilePath = s.FilePath,
                    AlbumId = s.AlbumId,
                    AlbumTitle = s.Album != null ? s.Album.Title : null,
                    AlbumCoverImageUrl = s.Album != null ? s.Album.CoverImageUrl : null,
                    CoverImageUrl = s.Album != null ? s.Album.CoverImageUrl : null,
                    AlbumReleaseYear = s.Album != null ? s.Album.ReleaseYear : null,
                    ArtistName = s.Album != null && s.Album.Artist != null ? s.Album.Artist.Name : null,
                    ArtistImageUrl = s.Album != null && s.Album.Artist != null ? s.Album.Artist.ImageUrl : null,
                    ArtistId = s.Album != null && s.Album.Artist != null ? s.Album.Artist.ArtistId : (int?)null,
                    ArtistBiography = s.Album != null && s.Album.Artist != null ? s.Album.Artist.Biography : null
                })
                .ToListAsync();

            response.Data = songs;
            return response;
        }
    }
}

