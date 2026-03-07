using AutoMapper;
using CostaRicaMusicBLL;
using CostaRicaMusicBLL.Dtos;
using CostaRicaMusicDAL.Repositorios.Generico;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CostaRicaMusicBLL.Servicios.Artists
{
    public class ArtistServicio : IArtistServicio
    {
        private readonly IMapper _mapper;
        private readonly IRepositorioGenerico<CostaRicaMusicDAL.Entidades.Artist> _repositorioGenerico;

        public ArtistServicio(IMapper mapper, IRepositorioGenerico<CostaRicaMusicDAL.Entidades.Artist> repositorioGenerico)
        {
            _mapper = mapper;
            _repositorioGenerico = repositorioGenerico;
        }

        public async Task<CustomResponse<ArtistDto>> ActualizarArtistAsync(ArtistDto artistDto)
        {
            var response = new CustomResponse<ArtistDto>();

            if (artistDto is null)
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Artist.Null;
                response.codigoStatus = 400;
                return response;
            }

            var artistActualiza = _mapper.Map<CostaRicaMusicDAL.Entidades.Artist>(artistDto);
            _repositorioGenerico.ActualizarAsync(artistActualiza);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = "Error al actualizar el artista en la base de datos.";
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<ArtistDto>> AgregarArtistAsync(ArtistDto artistDto)
        {
            var response = new CustomResponse<ArtistDto>();

            if (artistDto is null)
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Artist.Null;
                response.codigoStatus = 400;
                return response;
            }

            var artistGuardar = _mapper.Map<CostaRicaMusicDAL.Entidades.Artist>(artistDto);
            _repositorioGenerico.AgregarAsync(artistGuardar);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Artist.ErrorGuardar;
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<ArtistDto>> EliminarArtistAsync(int id)
        {
            var response = new CustomResponse<ArtistDto>();

            if (id is 0)
            {
                response.esCorrecto = false;
                response.mensaje = "El identificador del artista no es válido.";
                response.codigoStatus = 400;
                return response;
            }

            _repositorioGenerico.EliminarAsync(id);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Artist.ErrorEliminar;
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<ArtistDto>> ObtenerArtistPorIdAsync(int id)
        {
            var response = new CustomResponse<ArtistDto>();

            var artist = await _repositorioGenerico.ObtenerPorIdAsync(id);

            if (artist is null)
            {
                response.esCorrecto = false;
                response.mensaje = "El artista no existe.";
                response.codigoStatus = 404;
                return response;
            }

            response.Data = _mapper.Map<ArtistDto>(artist);
            return response;
        }

        public async Task<CustomResponse<List<ArtistDto>>> ObtenerArtistsAsync()
        {
            var response = new CustomResponse<List<ArtistDto>>();
            response.Data = _mapper.Map<List<ArtistDto>>(await _repositorioGenerico.ObtenerTodosAsync());
            return response;
        }
    }
}

