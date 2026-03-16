using AutoMapper;
using CostaRicaMusicBLL;
using CostaRicaMusicBLL.Dtos;
using CostaRicaMusicDAL.Repositorios.Generico;
using CostaRicaMusicDAL.Data;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace CostaRicaMusicBLL.Servicios.Playlists
{
    public class PlaylistServicio : IPlaylistServicio
    {
        private readonly IMapper _mapper;
        private readonly IRepositorioGenerico<CostaRicaMusicDAL.Entidades.Playlist> _repositorioGenerico;
        private readonly IHostEnvironment _hostEnvironment;
        private readonly CostaRicaMusicDbContext _context;

        public PlaylistServicio(IMapper mapper,
            IRepositorioGenerico<CostaRicaMusicDAL.Entidades.Playlist> repositorioGenerico,
            IHostEnvironment hostEnvironment,
            CostaRicaMusicDbContext context)
        {
            _mapper = mapper;
            _repositorioGenerico = repositorioGenerico;
            _hostEnvironment = hostEnvironment;
            _context = context;
        }

        public async Task<CustomResponse<PlaylistDto>> ActualizarPlaylistAsync(PlaylistDto playlistDto, IFormFile? imagenPortada = null, bool eliminarImagen = false, int userId = 0)
        {
            var response = new CustomResponse<PlaylistDto>();

            if (playlistDto is null)
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Playlist.Null;
                response.codigoStatus = 400;
                return response;
            }

            // Obtener la playlist existente para manejar la imagen
            var playlistExistente = await _repositorioGenerico.ObtenerPorIdAsync(playlistDto.PlaylistId);
            if (playlistExistente is null)
            {
                response.esCorrecto = false;
                response.mensaje = "La playlist no existe.";
                response.codigoStatus = 404;
                return response;
            }
            if (playlistExistente.UserId != userId)
            {
                response.esCorrecto = false;
                response.mensaje = "No tienes permisos para editar esta playlist.";
                response.codigoStatus = 403;
                return response;
            }

            // Procesar nueva imagen si viene (prioridad mas alta)
            if (imagenPortada != null && imagenPortada.Length > 0)
            {
                // Eliminar imagen anterior si no es placeholder
                if (!string.IsNullOrEmpty(playlistExistente.CoverImageUrl) &&
                    !playlistExistente.CoverImageUrl.Contains("placeholder"))
                {
                    await EliminarImagenAsync(playlistExistente.CoverImageUrl);
                }

                // Guardar nueva imagen
                playlistDto.CoverImageUrl = await GuardarImagenAsync(imagenPortada);
            }
            else if (eliminarImagen)
            {
                // Eliminar imagen actual y dejar placeholder
                if (!string.IsNullOrEmpty(playlistExistente.CoverImageUrl) &&
                    !playlistExistente.CoverImageUrl.Contains("placeholder"))
                {
                    await EliminarImagenAsync(playlistExistente.CoverImageUrl);
                }

                playlistDto.CoverImageUrl = "/img/placeholder-cover.png";
            }
            else
            {
                // Mantener la imagen existente
                playlistDto.CoverImageUrl = playlistExistente.CoverImageUrl;
            }

            playlistDto.UserId = userId;
            var playlistActualiza = _mapper.Map<CostaRicaMusicDAL.Entidades.Playlist>(playlistDto);
            _repositorioGenerico.ActualizarAsync(playlistActualiza);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = "Error al actualizar la playlist en la base de datos.";
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<PlaylistDto>> AgregarPlaylistAsync(PlaylistDto playlistDto, IFormFile? imagenPortada = null, int userId = 0)
        {
            var response = new CustomResponse<PlaylistDto>();

            if (playlistDto is null)
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Playlist.Null;
                response.codigoStatus = 400;
                return response;
            }
            if (userId <= 0)
            {
                response.esCorrecto = false;
                response.mensaje = "Usuario no valido.";
                response.codigoStatus = 401;
                return response;
            }
            playlistDto.UserId = userId;

            // Procesar la imagen si viene
            string? rutaImagen = null;
            if (imagenPortada != null && imagenPortada.Length > 0)
            {
                try
                {
                    rutaImagen = await GuardarImagenAsync(imagenPortada);
                    playlistDto.CoverImageUrl = rutaImagen; // ASIGNAR AL DTO
                    Console.WriteLine($"Imagen guardada en: {rutaImagen}"); // DEBUG
                }
                catch (Exception ex)
                {
                    response.esCorrecto = false;
                    response.mensaje = $"Error al guardar la imagen: {ex.Message}";
                    response.codigoStatus = 500;
                    return response;
                }
            }
            else
            {
                // Si no hay imagen, usar placeholder
                playlistDto.CoverImageUrl = "/img/placeholder-cover.png";
            }

            // Mapear DTO a entidad
            var playlistGuardar = _mapper.Map<CostaRicaMusicDAL.Entidades.Playlist>(playlistDto);

            // Verificar que la entidad tiene la URL
            Console.WriteLine($"Entidad a guardar - CoverImageUrl: {playlistGuardar.CoverImageUrl}"); // DEBUG

            _repositorioGenerico.AgregarAsync(playlistGuardar);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                // Si falla al guardar en BD, eliminar la imagen que se subió
                if (!string.IsNullOrEmpty(rutaImagen) && !rutaImagen.Contains("placeholder"))
                {
                    await EliminarImagenAsync(rutaImagen);
                }

                response.esCorrecto = false;
                response.mensaje = Constantes.Playlist.ErrorGuardar;
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<PlaylistDto>> EliminarPlaylistAsync(int id, int userId)
        {
            var response = new CustomResponse<PlaylistDto>();

            if (id == 0)
            {
                response.esCorrecto = false;
                response.mensaje = "El identificador de la playlist no es válido.";
                response.codigoStatus = 400;
                return response;
            }

            // Obtener la playlist para eliminar su imagen
            var playlist = await _repositorioGenerico.ObtenerPorIdAsync(id);
            if (playlist is null)
            {
                response.esCorrecto = false;
                response.mensaje = "La playlist no existe.";
                response.codigoStatus = 404;
                return response;
            }
            if (playlist.UserId != userId)
            {
                response.esCorrecto = false;
                response.mensaje = "No tienes permisos para eliminar esta playlist.";
                response.codigoStatus = 403;
                return response;
            }
            if (!string.IsNullOrEmpty(playlist.CoverImageUrl) &&
                !playlist.CoverImageUrl.Contains("placeholder"))
            {
                await EliminarImagenAsync(playlist.CoverImageUrl);
            }

            _repositorioGenerico.EliminarAsync(id);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Playlist.ErrorEliminar;
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<PlaylistDto>> ObtenerPlaylistPorIdAsync(int id, int userId)
        {
            var response = new CustomResponse<PlaylistDto>();

            var playlist = await _repositorioGenerico.ObtenerPorIdAsync(id);

            if (playlist is null)
            {
                response.esCorrecto = false;
                response.mensaje = "La playlist no existe.";
                response.codigoStatus = 404;
                return response;
            }
            if (playlist.UserId != userId)
            {
                response.esCorrecto = false;
                response.mensaje = "No tienes permisos para ver esta playlist.";
                response.codigoStatus = 403;
                return response;
            }

            response.Data = _mapper.Map<PlaylistDto>(playlist);
            return response;
        }

        public async Task<CustomResponse<List<PlaylistDto>>> ObtenerPlaylistsAsync(int userId)
        {
            var response = new CustomResponse<List<PlaylistDto>>();

            var playlists = await _context.Playlists
                .AsNoTracking()
                .Where(p => p.UserId == userId)
                .Include(p => p.PlaylistSongs)
                    .ThenInclude(ps => ps.Song)
                        .ThenInclude(s => s.Album)
                .ToListAsync();

            response.Data = playlists.Select(p => new PlaylistDto
            {
                PlaylistId = p.PlaylistId,
                Name = p.Name,
                UserId = p.UserId,
                CoverImageUrl = p.CoverImageUrl,
                SongCount = p.PlaylistSongs.Count,
                ThumbnailImages = p.PlaylistSongs
                    .OrderBy(ps => ps.AddedAt)
                    .Select(ps => NormalizarRutaImagen(ps.Song?.Album?.CoverImageUrl)
                        ?? NormalizarRutaImagen(ps.Song?.CoverImageUrl)
                        ?? "/img/placeholder-cover.png")
                    .Distinct()
                    .Take(4)
                    .ToList()
            }).ToList();

            return response;
        }

        public async Task<CustomResponse<PlaylistDetailDto>> ObtenerDetallePlaylistAsync(int id, int userId)
        {
            var response = new CustomResponse<PlaylistDetailDto>();

            var playlist = await _context.Playlists
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.PlaylistSongs)
                    .ThenInclude(ps => ps.Song)
                        .ThenInclude(s => s.Album)
                            .ThenInclude(a => a.Artist)
                .Include(p => p.PlaylistSongs)
                    .ThenInclude(ps => ps.Song)
                        .ThenInclude(s => s.SongArtists)
                            .ThenInclude(sa => sa.Artist)
                .FirstOrDefaultAsync(p => p.PlaylistId == id && p.UserId == userId);

            if (playlist is null)
            {
                response.esCorrecto = false;
                response.mensaje = "La playlist no existe.";
                response.codigoStatus = 404;
                return response;
            }

            var canciones = playlist.PlaylistSongs
                .OrderBy(ps => ps.AddedAt)
                .Select((ps, index) => new PlaylistSongDetailDto
                {
                    SongId = ps.SongId,
                    TrackNumber = index + 1,
                    Title = ps.Song?.Title ?? "Sin titulo",
                    ArtistName = ps.Song?.Album?.Artist?.Name
                        ?? ps.Song?.SongArtists?.FirstOrDefault()?.Artist?.Name
                        ?? "Artista desconocido",
                    AlbumTitle = string.IsNullOrWhiteSpace(ps.Song?.Album?.Title) ? "Single" : ps.Song.Album.Title,
                    DurationSeconds = ps.Song?.Duration ?? 0,
                    FilePath = ps.Song?.FilePath ?? string.Empty,
                    CoverImageUrl = NormalizarRutaImagen(ps.Song?.Album?.CoverImageUrl)
                        ?? NormalizarRutaImagen(ps.Song?.CoverImageUrl)
                        ?? "/img/placeholder-cover.png"
                })
                .ToList();

            var imagenesHeader = canciones
                .Select(c => c.CoverImageUrl)
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Distinct()
                .Take(4)
                .ToList();

            response.Data = new PlaylistDetailDto
            {
                PlaylistId = playlist.PlaylistId,
                Name = playlist.Name,
                UserId = playlist.UserId,
                Username = playlist.User?.Username ?? $"Usuario {playlist.UserId}",
                CoverImageUrl = playlist.CoverImageUrl,
                SongCount = canciones.Count,
                TotalDurationSeconds = canciones.Sum(c => c.DurationSeconds),
                HeaderCollageImages = imagenesHeader,
                Songs = canciones
            };

            return response;
        }

        public async Task<CustomResponse<bool>> AgregarCancionAPlaylistAsync(int playlistId, int songId, int userId)
        {
            var response = new CustomResponse<bool>();

            if (playlistId <= 0 || songId <= 0)
            {
                response.esCorrecto = false;
                response.mensaje = "Datos no validos para agregar la cancion.";
                response.codigoStatus = 400;
                response.Data = false;
                return response;
            }

            var playlist = await _context.Playlists
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.PlaylistId == playlistId);

            if (playlist is null)
            {
                response.esCorrecto = false;
                response.mensaje = "La playlist no existe.";
                response.codigoStatus = 404;
                response.Data = false;
                return response;
            }

            if (playlist.UserId != userId)
            {
                response.esCorrecto = false;
                response.mensaje = "No tienes permisos para modificar esta playlist.";
                response.codigoStatus = 403;
                response.Data = false;
                return response;
            }

            var songExiste = await _context.Songs
                .AsNoTracking()
                .AnyAsync(s => s.SongId == songId);
            if (!songExiste)
            {
                response.esCorrecto = false;
                response.mensaje = "La cancion no existe.";
                response.codigoStatus = 404;
                response.Data = false;
                return response;
            }

            var yaExiste = await _context.PlaylistSongs
                .AsNoTracking()
                .AnyAsync(ps => ps.PlaylistId == playlistId && ps.SongId == songId);
            if (yaExiste)
            {
                response.esCorrecto = false;
                response.mensaje = "La cancion ya existe en esta playlist.";
                response.codigoStatus = 409;
                response.Data = false;
                return response;
            }

            _context.PlaylistSongs.Add(new CostaRicaMusicDAL.Entidades.PlaylistSong
            {
                PlaylistId = playlistId,
                SongId = songId,
                AddedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            response.esCorrecto = true;
            response.Data = true;
            response.mensaje = "Cancion agregada a la playlist.";
            return response;
        }

        public async Task<CustomResponse<bool>> EliminarCancionDePlaylistAsync(int playlistId, int songId, int userId)
        {
            var response = new CustomResponse<bool>();

            if (playlistId <= 0 || songId <= 0)
            {
                response.esCorrecto = false;
                response.mensaje = "Datos no validos para eliminar la cancion de la playlist.";
                response.codigoStatus = 400;
                response.Data = false;
                return response;
            }

            var relacion = await _context.PlaylistSongs
                .FirstOrDefaultAsync(ps => ps.PlaylistId == playlistId && ps.SongId == songId);

            if (relacion is null)
            {
                response.esCorrecto = false;
                response.mensaje = "La cancion no existe dentro de la playlist.";
                response.codigoStatus = 404;
                response.Data = false;
                return response;
            }

            var playlist = await _context.Playlists
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.PlaylistId == playlistId);
            if (playlist is null || playlist.UserId != userId)
            {
                response.esCorrecto = false;
                response.mensaje = "No tienes permisos para modificar esta playlist.";
                response.codigoStatus = 403;
                response.Data = false;
                return response;
            }

            _context.PlaylistSongs.Remove(relacion);
            await _context.SaveChangesAsync();

            response.esCorrecto = true;
            response.Data = true;
            response.mensaje = "Cancion eliminada de la playlist.";
            return response;
        }

        private static string? NormalizarRutaImagen(string? ruta)
        {
            if (string.IsNullOrWhiteSpace(ruta))
            {
                return null;
            }

            // Permite URLs absolutas externas (http/https)
            if (Uri.TryCreate(ruta, UriKind.Absolute, out _))
            {
                return ruta;
            }

            var rutaNormalizada = ruta.Replace('\\', '/').Trim();

            // Si viene como "img/albums/..." convertir a "/img/albums/..."
            if (!rutaNormalizada.StartsWith('/'))
            {
                rutaNormalizada = "/" + rutaNormalizada;
            }

            return rutaNormalizada;
        }

        // Métodos privados para manejo de imágenes
        private async Task<string> GuardarImagenAsync(IFormFile imagen)
        {
            try
            {
                // Validar tipo de archivo
                var extension = Path.GetExtension(imagen.FileName).ToLower();
                var tiposPermitidos = new[] { ".jpg", ".jpeg", ".png", ".gif", ".avif" };

                if (!tiposPermitidos.Contains(extension))
                {
                    throw new Exception("Tipo de archivo no permitido. Use JPG, PNG, GIF o AVIF.");
                }

                // Validar tamaño (máx 5MB)
                if (imagen.Length > 5 * 1024 * 1024)
                {
                    throw new Exception("La imagen no puede ser mayor a 5MB.");
                }

                // Generar nombre único
                string nombreArchivo = $"{Guid.NewGuid()}{extension}";

                // Obtener ruta de la carpeta wwwroot/img/playlist
                string webRootPath = _hostEnvironment.ContentRootPath;
                string rutaCarpeta = Path.Combine(webRootPath, "wwwroot", "img", "playlist");

                // Crear carpeta si no existe
                if (!Directory.Exists(rutaCarpeta))
                {
                    Directory.CreateDirectory(rutaCarpeta);
                }

                // Ruta completa del archivo
                string rutaCompleta = Path.Combine(rutaCarpeta, nombreArchivo);

                // Guardar el archivo
                using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                {
                    await imagen.CopyToAsync(stream);
                }

                // Retornar ruta relativa para la BD
                return $"/img/playlist/{nombreArchivo}";
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al guardar la imagen: {ex.Message}");
            }
        }

        private async Task EliminarImagenAsync(string rutaImagen)
        {
            try
            {
                if (string.IsNullOrEmpty(rutaImagen)) return;

                string webRootPath = _hostEnvironment.ContentRootPath;
                string rutaCompleta = Path.Combine(webRootPath, "wwwroot",
                    rutaImagen.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

                if (File.Exists(rutaCompleta))
                {
                    File.Delete(rutaCompleta);
                }

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                // Log del error pero no interrumpimos el flujo
                Console.WriteLine($"Error al eliminar imagen: {ex.Message}");
            }
        }
    }
}