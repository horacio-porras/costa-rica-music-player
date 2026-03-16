using CostaRicaMusicBLL.Dtos;
using CostaRicaMusicBLL.Servicios.Auth;
using Microsoft.AspNetCore.Mvc;

namespace CostaRicaMusicPlayer.Controllers
{
    public class AccountController : Controller
    {
        private readonly IAuthServicio _authServicio;

        public AccountController(IAuthServicio authServicio)
        {
            _authServicio = authServicio;
        }

        [HttpGet]
        public IActionResult Login()
        {
            if (HttpContext.Session.GetInt32("UserId").HasValue)
            {
                return RedirectToAction("Index", "Playlists");
            }
            return View(new LoginDto());
        }

        [HttpPost]
        public async Task<IActionResult> Login(LoginDto model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var response = await _authServicio.LoginAsync(model);
            if (!response.esCorrecto || response.Data == null)
            {
                ViewBag.Error = response.mensaje ?? "No fue posible iniciar sesion.";
                return View(model);
            }

            HttpContext.Session.SetInt32("UserId", response.Data.UserId);
            HttpContext.Session.SetString("Username", response.Data.Username);
            return RedirectToAction("Index", "Playlists");
        }

        [HttpGet]
        public IActionResult SignUp()
        {
            if (HttpContext.Session.GetInt32("UserId").HasValue)
            {
                return RedirectToAction("Index", "Playlists");
            }
            return View(new RegisterDto());
        }

        [HttpPost]
        public async Task<IActionResult> SignUp(RegisterDto model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var response = await _authServicio.RegisterAsync(model);
            if (!response.esCorrecto || response.Data == null)
            {
                ViewBag.Error = response.mensaje ?? "No fue posible registrar el usuario.";
                return View(model);
            }

            HttpContext.Session.SetInt32("UserId", response.Data.UserId);
            HttpContext.Session.SetString("Username", response.Data.Username);
            return RedirectToAction("Index", "Playlists");
        }

        [HttpPost]
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Home");
        }
    }
}
