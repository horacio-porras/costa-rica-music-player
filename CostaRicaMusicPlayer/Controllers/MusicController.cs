using Microsoft.AspNetCore.Mvc;
using CostaRicaMusicBLL.Servicios.Artists;
using CostaRicaMusicBLL.Servicios.Songs;
using System.Threading.Tasks;

namespace CostaRicaMusicPlayer.Controllers
{
    public class MusicController : Controller
    {
        private readonly ISongServicio _songServicio;
        private readonly IArtistServicio _artistServicio;
        public MusicController(ISongServicio songServicio, IArtistServicio artistServicio)
        {
            _songServicio = songServicio;
            _artistServicio = artistServicio;
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
    }
}

