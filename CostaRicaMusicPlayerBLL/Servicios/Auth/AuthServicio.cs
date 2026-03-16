using CostaRicaMusicBLL.Dtos;
using CostaRicaMusicDAL.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace CostaRicaMusicBLL.Servicios.Auth
{
    public class AuthServicio : IAuthServicio
    {
        private readonly CostaRicaMusicDbContext _context;

        public AuthServicio(CostaRicaMusicDbContext context)
        {
            _context = context;
        }

        public async Task<CustomResponse<AuthUserDto>> LoginAsync(LoginDto loginDto)
        {
            var response = new CustomResponse<AuthUserDto>();

            if (loginDto == null || string.IsNullOrWhiteSpace(loginDto.EmailOrUsername) || string.IsNullOrWhiteSpace(loginDto.Password))
            {
                response.esCorrecto = false;
                response.mensaje = "Credenciales invalidas.";
                response.codigoStatus = 400;
                return response;
            }

            var usuario = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email == loginDto.EmailOrUsername || u.Username == loginDto.EmailOrUsername);

            if (usuario == null || !VerifyPassword(loginDto.Password, usuario.PasswordHash))
            {
                response.esCorrecto = false;
                response.mensaje = "Usuario o contrasena incorrectos.";
                response.codigoStatus = 401;
                return response;
            }

            response.esCorrecto = true;
            response.Data = new AuthUserDto
            {
                UserId = usuario.UserId,
                Username = usuario.Username,
                Email = usuario.Email
            };
            return response;
        }

        public async Task<CustomResponse<AuthUserDto>> RegisterAsync(RegisterDto registerDto)
        {
            var response = new CustomResponse<AuthUserDto>();

            if (registerDto == null || string.IsNullOrWhiteSpace(registerDto.Username) ||
                string.IsNullOrWhiteSpace(registerDto.Email) || string.IsNullOrWhiteSpace(registerDto.Password))
            {
                response.esCorrecto = false;
                response.mensaje = "Datos de registro invalidos.";
                response.codigoStatus = 400;
                return response;
            }

            var existeUsuario = await _context.Users.AnyAsync(u =>
                u.Username == registerDto.Username || u.Email == registerDto.Email);

            if (existeUsuario)
            {
                response.esCorrecto = false;
                response.mensaje = "El usuario o correo ya existe.";
                response.codigoStatus = 409;
                return response;
            }

            var nuevoUsuario = new CostaRicaMusicDAL.Entidades.User
            {
                Username = registerDto.Username.Trim(),
                Email = registerDto.Email.Trim(),
                PasswordHash = HashPassword(registerDto.Password)
            };

            _context.Users.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            response.esCorrecto = true;
            response.Data = new AuthUserDto
            {
                UserId = nuevoUsuario.UserId,
                Username = nuevoUsuario.Username,
                Email = nuevoUsuario.Email
            };
            return response;
        }

        private static string HashPassword(string password)
        {
            byte[] salt = RandomNumberGenerator.GetBytes(16);
            byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100000, HashAlgorithmName.SHA256, 32);
            return $"v1|{Convert.ToBase64String(salt)}|{Convert.ToBase64String(hash)}";
        }

        private static bool VerifyPassword(string password, string storedHash)
        {
            if (string.IsNullOrWhiteSpace(storedHash))
            {
                return false;
            }

            // Compatibilidad con datos de semilla antiguos (texto simple)
            if (!storedHash.StartsWith("v1|", StringComparison.Ordinal))
            {
                return storedHash == password;
            }

            var parts = storedHash.Split('|');
            if (parts.Length != 3)
            {
                return false;
            }

            try
            {
                var salt = Convert.FromBase64String(parts[1]);
                var expectedHash = Convert.FromBase64String(parts[2]);
                var actualHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100000, HashAlgorithmName.SHA256, 32);
                return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
            }
            catch
            {
                return false;
            }
        }
    }
}
