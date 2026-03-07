using AutoMapper;
using CostaRicaMusicBLL;
using CostaRicaMusicBLL.Dtos;
using CostaRicaMusicDAL.Repositorios.Generico;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace CostaRicaMusicBLL.Servicios.Playlists
{
    public class PlaylistServicio : IPlaylistServicio
    {
        private readonly IMapper _mapper;
        private readonly IRepositorioGenerico<CostaRicaMusicDAL.Entidades.Playlist> _repositorioGenerico;
        private readonly IHostEnvironment _hostEnvironment;

        public PlaylistServicio(IMapper mapper,
            IRepositorioGenerico<CostaRicaMusicDAL.Entidades.Playlist> repositorioGenerico,
            IHostEnvironment hostEnvironment)
        {
            _mapper = mapper;
            _repositorioGenerico = repositorioGenerico;
            _hostEnvironment = hostEnvironment;
        }

        public async Task<CustomResponse<PlaylistDto>> ActualizarPlaylistAsync(PlaylistDto playlistDto, IFormFile? imagenPortada = null)
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

            // Procesar nueva imagen si viene
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
            else
            {
                // Mantener la imagen existente
                playlistDto.CoverImageUrl = playlistExistente.CoverImageUrl;
            }

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

        public async Task<CustomResponse<PlaylistDto>> AgregarPlaylistAsync(PlaylistDto playlistDto, IFormFile? imagenPortada = null)
        {
            var response = new CustomResponse<PlaylistDto>();

            if (playlistDto is null)
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Playlist.Null;
                response.codigoStatus = 400;
                return response;
            }

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
                playlistDto.CoverImageUrl = "/img/placeholder-playlist.jpg";
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

        public async Task<CustomResponse<PlaylistDto>> EliminarPlaylistAsync(int id)
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
            if (playlist != null && !string.IsNullOrEmpty(playlist.CoverImageUrl) &&
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

        public async Task<CustomResponse<PlaylistDto>> ObtenerPlaylistPorIdAsync(int id)
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

            response.Data = _mapper.Map<PlaylistDto>(playlist);
            return response;
        }

        public async Task<CustomResponse<List<PlaylistDto>>> ObtenerPlaylistsAsync()
        {
            var response = new CustomResponse<List<PlaylistDto>>();
            var playlists = await _repositorioGenerico.ObtenerTodosAsync();
            response.Data = _mapper.Map<List<PlaylistDto>>(playlists);
            return response;
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