using Microsoft.AspNetCore.Mvc;
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
        public async Task<IActionResult> AgregarPlaylist(PlaylistDto playlist)
        {
            var response = await _playlistServicio.AgregarPlaylistAsync(playlist);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> ActualizarPlaylist(PlaylistDto playlist)
        {
            var response = await _playlistServicio.ActualizarPlaylistAsync(playlist);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> EliminarPlaylist(int id)
        {
            var response = await _playlistServicio.EliminarPlaylistAsync(id);
            return Json(response);
        }
    }
}

