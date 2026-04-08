using CostaRicaMusicBLL.Dtos;
using CostaRicaMusicBLL.Servicios.Auth;
using Microsoft.AspNetCore.Mvc;

namespace CostaRicaMusicPlayerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthServicio _authServicio;

    public AuthController(IAuthServicio authServicio)
    {
        _authServicio = authServicio;
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(CustomResponse<AuthUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CustomResponse<AuthUserDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(CustomResponse<AuthUserDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new CustomResponse<AuthUserDto>
            {
                esCorrecto = false,
                mensaje = "Datos de inicio de sesion invalidos.",
                codigoStatus = 400
            });
        }

        var response = await _authServicio.LoginAsync(model);
        return StatusCode(response.codigoStatus, response);
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(CustomResponse<AuthUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CustomResponse<AuthUserDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(CustomResponse<AuthUserDto>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new CustomResponse<AuthUserDto>
            {
                esCorrecto = false,
                mensaje = "Datos de registro invalidos.",
                codigoStatus = 400
            });
        }

        var response = await _authServicio.RegisterAsync(model);
        return StatusCode(response.codigoStatus, response);
    }
}
