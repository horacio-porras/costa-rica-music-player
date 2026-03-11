using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using CostaRicaMusicBLL.Dtos;
using CostaRicaMusicBLL.Servicios.Playlists;
using System.Threading.Tasks;

namespace CostaRicaMusicPlayer.Controllers
{
    public class PlaylistsController : Controller
    {
        private readonly IPlaylistServicio _playlistServicio;

        public PlaylistsController(IPlaylistServicio playlistServicio)
        {
            _playlistServicio = playlistServicio;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Detalle(int id)
        {
            var response = await _playlistServicio.ObtenerDetallePlaylistAsync(id);
            if (!response.esCorrecto || response.Data is null)
            {
                return RedirectToAction(nameof(Index));
            }

            return View(response.Data);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerPlaylists()
        {
            var response = await _playlistServicio.ObtenerPlaylistsAsync();
            return Json(response);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerPlaylistPorId(int id)
        {
            var response = await _playlistServicio.ObtenerPlaylistPorIdAsync(id);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> AgregarPlaylist(PlaylistDto playlist, IFormFile? imagenPortada = null)
        {
            var response = await _playlistServicio.AgregarPlaylistAsync(playlist, imagenPortada);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> ActualizarPlaylist(PlaylistDto playlist, IFormFile? imagenPortada = null, bool eliminarImagen = false)
        {
            var response = await _playlistServicio.ActualizarPlaylistAsync(playlist, imagenPortada, eliminarImagen);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> EliminarPlaylist(int id)
        {
            var response = await _playlistServicio.EliminarPlaylistAsync(id);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> EliminarCancionDePlaylist(int playlistId, int songId)
        {
            var response = await _playlistServicio.EliminarCancionDePlaylistAsync(playlistId, songId);
            return Json(response);
        }
    }
}

