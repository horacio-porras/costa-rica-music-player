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
        private int? UserId => HttpContext.Session.GetInt32("UserId");

        public PlaylistsController(IPlaylistServicio playlistServicio)
        {
            _playlistServicio = playlistServicio;
        }

        public IActionResult Index()
        {
            if (!UserId.HasValue)
            {
                return RedirectToAction("Login", "Account");
            }
            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public async Task<IActionResult> Detalle(int id)
        {
            if (!UserId.HasValue)
            {
                return RedirectToAction("Login", "Account");
            }

            var response = await _playlistServicio.ObtenerDetallePlaylistAsync(id, UserId.Value);
            if (!response.esCorrecto || response.Data is null)
            {
                return RedirectToAction(nameof(Index));
            }

            return View(response.Data);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerPlaylists()
        {
            if (!UserId.HasValue)
            {
                return Json(new { esCorrecto = false, mensaje = "Sesion no valida", codigoStatus = 401 });
            }

            var response = await _playlistServicio.ObtenerPlaylistsAsync(UserId.Value);
            return Json(response);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerPlaylistPorId(int id)
        {
            if (!UserId.HasValue)
            {
                return Json(new { esCorrecto = false, mensaje = "Sesion no valida", codigoStatus = 401 });
            }

            var response = await _playlistServicio.ObtenerPlaylistPorIdAsync(id, UserId.Value);
            return Json(response);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerDetallePlaylist(int id)
        {
            if (!UserId.HasValue)
            {
                return Json(new { esCorrecto = false, mensaje = "Sesion no valida", codigoStatus = 401 });
            }

            var response = await _playlistServicio.ObtenerDetallePlaylistAsync(id, UserId.Value);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> AgregarPlaylist(PlaylistDto playlist, IFormFile? imagenPortada = null)
        {
            if (!UserId.HasValue)
            {
                return Json(new { esCorrecto = false, mensaje = "Sesion no valida", codigoStatus = 401 });
            }

            playlist.UserId = UserId.Value;
            var response = await _playlistServicio.AgregarPlaylistAsync(playlist, imagenPortada, UserId.Value);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> ActualizarPlaylist(PlaylistDto playlist, IFormFile? imagenPortada = null, bool eliminarImagen = false)
        {
            if (!UserId.HasValue)
            {
                return Json(new { esCorrecto = false, mensaje = "Sesion no valida", codigoStatus = 401 });
            }

            playlist.UserId = UserId.Value;
            var response = await _playlistServicio.ActualizarPlaylistAsync(playlist, imagenPortada, eliminarImagen, UserId.Value);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> AgregarCancionAPlaylist(int playlistId, int songId)
        {
            if (!UserId.HasValue)
            {
                return Json(new { esCorrecto = false, mensaje = "Sesion no valida", codigoStatus = 401 });
            }

            var response = await _playlistServicio.AgregarCancionAPlaylistAsync(playlistId, songId, UserId.Value);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> EliminarPlaylist(int id)
        {
            if (!UserId.HasValue)
            {
                return Json(new { esCorrecto = false, mensaje = "Sesion no valida", codigoStatus = 401 });
            }

            var response = await _playlistServicio.EliminarPlaylistAsync(id, UserId.Value);
            return Json(response);
        }

        [HttpPost]
        public async Task<IActionResult> EliminarCancionDePlaylist(int playlistId, int songId)
        {
            if (!UserId.HasValue)
            {
                return Json(new { esCorrecto = false, mensaje = "Sesion no valida", codigoStatus = 401 });
            }

            var response = await _playlistServicio.EliminarCancionDePlaylistAsync(playlistId, songId, UserId.Value);
            return Json(response);
        }
    }
}

