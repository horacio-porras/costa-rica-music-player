using Microsoft.AspNetCore.Mvc;
using CostaRicaMusicBLL.Servicios.Artists;
using CostaRicaMusicBLL.Servicios.Songs;
using CostaRicaMusicBLL.Servicios.Albums;
using System.Threading.Tasks;

namespace CostaRicaMusicPlayer.Controllers
{
    public class MusicController : Controller
    {
        private readonly ISongServicio _songServicio;
        private readonly IArtistServicio _artistServicio;
        private readonly IAlbumServicio _albumServicio;
        private readonly IWebHostEnvironment _env;

        public MusicController(ISongServicio songServicio, IArtistServicio artistServicio, IAlbumServicio albumServicio, IWebHostEnvironment env)
        {
            _songServicio = songServicio;
            _artistServicio = artistServicio;
            _albumServicio = albumServicio;
            _env = env;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerSongs()
        {
            var response = await _songServicio.ObtenerSongsConDetallesAsync();
            return Json(response);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerArtists()
        {
            var response = await _artistServicio.ObtenerArtistsAsync();
            return Json(response);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerArtistPorId(int id)
        {
            var response = await _artistServicio.ObtenerArtistPorIdAsync(id);
            return Json(response);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerAlbums()
        {
            var response = await _albumServicio.ObtenerAlbumsAsync();
            return Json(response);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerAlbumPorId(int id)
        {
            var response = await _albumServicio.ObtenerAlbumPorIdAsync(id);
            return Json(response);
        }

        /// <summary>
        /// Sirve el archivo de audio de una canción para reproducción en el navegador.
        /// FilePath en la BD puede ser relativo a wwwroot (ej: "audio/cancion.mp3") o una ruta completa.
        /// </summary>
        [HttpGet]
        [Route("Music/StreamSong/{id:int}")]
        public async Task<IActionResult> StreamSong(int id)
        {
            var response = await _songServicio.ObtenerSongPorIdAsync(id);
            if (!response.esCorrecto || response.Data == null)
                return NotFound();

            var filePath = response.Data.FilePath?.Trim();
            if (string.IsNullOrEmpty(filePath))
                return NotFound();

            string fullPath;
            if (Path.IsPathRooted(filePath))
            {
                fullPath = filePath;
            }
            else
            {
                var relativePath = filePath.TrimStart('/', '\\');
                fullPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), relativePath);
            }

            if (!System.IO.File.Exists(fullPath))
                return NotFound();

            var ext = Path.GetExtension(fullPath).ToLowerInvariant();
            var contentType = ext switch
            {
                ".mp3" => "audio/mpeg",
                ".wav" => "audio/wav",
                ".ogg" => "audio/ogg",
                ".m4a" => "audio/mp4",
                ".aac" => "audio/aac",
                _ => "application/octet-stream"
            };

            return PhysicalFile(fullPath, contentType, enableRangeProcessing: true);
        }
    }
}

