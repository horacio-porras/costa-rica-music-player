using AutoMapper;
using System;
using System.Collections.Generic;
using System.Text;

namespace CostaRicaMusicBLL
{
    public class MapeoClases : Profile
    {
        public MapeoClases()
        {
            CreateMap<CostaRicaMusicDAL.Entidades.Song, CostaRicaMusicBLL.Dtos.SongDto>().ReverseMap();
            CreateMap<CostaRicaMusicDAL.Entidades.Artist, CostaRicaMusicBLL.Dtos.ArtistDto>().ReverseMap();
            CreateMap<CostaRicaMusicDAL.Entidades.Playlist, CostaRicaMusicBLL.Dtos.PlaylistDto>().ReverseMap();
            CreateMap<CostaRicaMusicDAL.Entidades.Album, CostaRicaMusicBLL.Dtos.AlbumDto>().ReverseMap();
        }
    }
}
