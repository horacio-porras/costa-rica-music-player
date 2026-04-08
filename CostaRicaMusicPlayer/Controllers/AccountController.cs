using System.Net.Http.Json;
using System.Text.Json;
using CostaRicaMusicBLL.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace CostaRicaMusicPlayer.Controllers
{
    public class AccountController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public AccountController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet]
        public IActionResult Login()
        {
            if (HttpContext.Session.GetInt32("UserId").HasValue)
            {
                return RedirectToAction("Index", "Home");
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

            var response = await PostAuthAsync<LoginDto, AuthUserDto>("api/auth/login", model);
            if (response == null)
            {
                ViewBag.Error = "No se pudo conectar con el servicio de autenticacion. Verifique que la API este en ejecucion.";
                return View(model);
            }

            if (!response.esCorrecto || response.Data == null)
            {
                ViewBag.Error = response.mensaje ?? "No fue posible iniciar sesion.";
                return View(model);
            }

            HttpContext.Session.SetInt32("UserId", response.Data.UserId);
            HttpContext.Session.SetString("Username", response.Data.Username);
            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult SignUp()
        {
            if (HttpContext.Session.GetInt32("UserId").HasValue)
            {
                return RedirectToAction("Index", "Home");
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

            var response = await PostAuthAsync<RegisterDto, AuthUserDto>("api/auth/register", model);
            if (response == null)
            {
                ViewBag.Error = "No se pudo conectar con el servicio de autenticacion. Verifique que la API este en ejecucion.";
                return View(model);
            }

            if (!response.esCorrecto || response.Data == null)
            {
                ViewBag.Error = response.mensaje ?? "No fue posible registrar el usuario.";
                return View(model);
            }

            HttpContext.Session.SetInt32("UserId", response.Data.UserId);
            HttpContext.Session.SetString("Username", response.Data.Username);
            return RedirectToAction("Index", "Home");
        }

        [HttpPost]
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Home");
        }

        private async Task<CustomResponse<TData>?> PostAuthAsync<TBody, TData>(string relativeUrl, TBody body)
        {
            var client = _httpClientFactory.CreateClient("AuthApi");
            try
            {
                using var httpResponse = await client.PostAsJsonAsync(relativeUrl, body);
                return await httpResponse.Content.ReadFromJsonAsync<CustomResponse<TData>>(JsonOptions);
            }
            catch (HttpRequestException)
            {
                return null;
            }
            catch (TaskCanceledException)
            {
                return null;
            }
            catch (JsonException)
            {
                return null;
            }
        }
    }
}
