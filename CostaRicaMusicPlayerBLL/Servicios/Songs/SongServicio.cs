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

            // Load entities into memory so we can assemble comma-separated artist names for songs with multiple artists
            var songEntities = await _context.Songs
                .Include(s => s.Album)
                    .ThenInclude(a => a.Artist)
                .Include(s => s.SongArtists)
                    .ThenInclude(sa => sa.Artist)
                .ToListAsync();

            var songs = songEntities.Select(s =>
                new CostaRicaMusicBLL.Dtos.SongDetailDto
                {
                    SongId = s.SongId,
                    Title = s.Title,
                    Duration = s.Duration,
                    FilePath = s.FilePath,
                    AlbumId = s.AlbumId,
                    AlbumTitle = s.Album != null ? s.Album.Title : null,
                    AlbumCoverImageUrl = s.Album != null ? s.Album.CoverImageUrl : null,
                    // Prefer an explicit song cover if present; otherwise fall back to album cover
                    CoverImageUrl = s.CoverImageUrl != null ? s.CoverImageUrl : (s.Album != null ? s.Album.CoverImageUrl : null),
                    AlbumReleaseYear = s.Album != null ? s.Album.ReleaseYear : null,
                    // If the song has an album and that album has an artist, use it; otherwise join all artists linked via SongArtists
                    ArtistName = s.Album != null && s.Album.Artist != null
                        ? s.Album.Artist.Name
                        : (s.SongArtists != null && s.SongArtists.Any()
                            ? string.Join(", ", s.SongArtists.Select(sa => sa.Artist?.Name).Where(n => !string.IsNullOrEmpty(n)))
                            : null),
                    // For image choose album artist image if available, otherwise the first non-empty artist image from SongArtists
                    ArtistImageUrl = s.Album != null && s.Album.Artist != null
                        ? s.Album.Artist.ImageUrl
                        : (s.SongArtists != null
                            ? s.SongArtists.Select(sa => sa.Artist?.ImageUrl).FirstOrDefault(img => !string.IsNullOrEmpty(img))
                            : null),
                    ArtistId = s.Album != null && s.Album.Artist != null
                        ? s.Album.Artist.ArtistId
                        : (s.SongArtists != null && s.SongArtists.Any()
                            ? s.SongArtists.Select(sa => (int?)sa.Artist.ArtistId).FirstOrDefault()
                            : (int?)null),
                    ArtistBiography = s.Album != null && s.Album.Artist != null
                        ? s.Album.Artist.Biography
                        : (s.SongArtists != null
                            ? s.SongArtists.Select(sa => sa.Artist?.Biography).FirstOrDefault(b => !string.IsNullOrEmpty(b))
                            : null)
                })
                .ToList();

            response.Data = songs;
            return response;
        }
    }
}

