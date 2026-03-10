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

        public MusicController(ISongServicio songServicio, IArtistServicio artistServicio, IAlbumServicio albumServicio)
        {
            _songServicio = songServicio;
            _artistServicio = artistServicio;
            _albumServicio = albumServicio;
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
    }
}

