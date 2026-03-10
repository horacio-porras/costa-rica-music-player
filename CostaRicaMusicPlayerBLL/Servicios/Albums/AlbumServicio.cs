using AutoMapper;
using CostaRicaMusicBLL.Dtos;
using CostaRicaMusicDAL.Repositorios.Generico;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CostaRicaMusicBLL.Servicios.Albums
{
    public class AlbumServicio : IAlbumServicio
    {
        private readonly IMapper _mapper;
        private readonly IRepositorioGenerico<CostaRicaMusicDAL.Entidades.Album> _repositorioGenerico;

        public AlbumServicio(IMapper mapper, IRepositorioGenerico<CostaRicaMusicDAL.Entidades.Album> repositorioGenerico)
        {
            _mapper = mapper;
            _repositorioGenerico = repositorioGenerico;
        }

        public async Task<CustomResponse<AlbumDto>> ActualizarAlbumAsync(AlbumDto albumDto)
        {
            var response = new CustomResponse<AlbumDto>();

            if (albumDto is null)
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Album.Null;
                response.codigoStatus = 400;
                return response;
            }

            var albumActualiza = _mapper.Map<CostaRicaMusicDAL.Entidades.Album>(albumDto);
            _repositorioGenerico.ActualizarAsync(albumActualiza);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = "Error al actualizar el álbum en la base de datos.";
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<AlbumDto>> AgregarAlbumAsync(AlbumDto albumDto)
        {
            var response = new CustomResponse<AlbumDto>();

            if (albumDto is null)
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Album.Null;
                response.codigoStatus = 400;
                return response;
            }

            var albumGuardar = _mapper.Map<CostaRicaMusicDAL.Entidades.Album>(albumDto);
            _repositorioGenerico.AgregarAsync(albumGuardar);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Album.ErrorGuardar;
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<AlbumDto>> EliminarAlbumAsync(int id)
        {
            var response = new CustomResponse<AlbumDto>();

            if (id is 0)
            {
                response.esCorrecto = false;
                response.mensaje = "El identificador del álbum no es válido.";
                response.codigoStatus = 400;
                return response;
            }

            _repositorioGenerico.EliminarAsync(id);

            if (!await _repositorioGenerico.GuardarCambiosAsync())
            {
                response.esCorrecto = false;
                response.mensaje = Constantes.Album.ErrorEliminar;
                response.codigoStatus = 500;
                return response;
            }

            return response;
        }

        public async Task<CustomResponse<AlbumDto>> ObtenerAlbumPorIdAsync(int id)
        {
            var response = new CustomResponse<AlbumDto>();

            var album = await _repositorioGenerico.ObtenerPorIdAsync(id);

            if (album is null)
            {
                response.esCorrecto = false;
                response.mensaje = "El álbum no existe.";
                response.codigoStatus = 404;
                return response;
            }

            response.Data = _mapper.Map<AlbumDto>(album);
            return response;
        }

        public async Task<CustomResponse<List<AlbumDto>>> ObtenerAlbumsAsync()
        {
            var response = new CustomResponse<List<AlbumDto>>();
            response.Data = _mapper.Map<List<AlbumDto>>(await _repositorioGenerico.ObtenerTodosAsync());
            return response;
        }
    }
}

