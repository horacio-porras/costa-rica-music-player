(() => {
    const Music = {
        songs: [],
        artists: [],
        albums: [],
        currentDisplayedSongs: [],

        init() {
            this.cargarSongs();
            this.cargarArtists();
            this.cargarAlbums();
            this.registrarEventos();
        },

        registrarEventos() {
            const self = this;
            $('#txtBuscarCancion').on('input', () => {
                const termino = $('#txtBuscarCancion').val().toLowerCase();
                self.filtrar(termino);
            });


            $(document).on('click', '.artist-card, .artist-name, .music-card-artist', (e) => {
                const el = $(e.currentTarget);
                const artistId = el.data('artist-id') || el.closest('.artist-card').data('artist-id');
                if (!artistId) return;
                self.mostrarArtist(artistId);
            });

            $(document).on('click', '.music-card', function(e) {
                if ($(e.target).closest('.music-card-artist, .music-card-album').length) return;
                const card = $(this);
                const songId = card.data('song-id');
                if (songId && window.Player) {
                    const song = self.currentDisplayedSongs.find(s => s.songId == songId);
                    if (song) window.Player.reproducir(song, self.currentDisplayedSongs);
                }
            });

            $(document).on('click', '.album-card, .music-card-album, .artist-album-item', (e) => {
                const el = $(e.currentTarget);

                // Buscar el album-id en el elemento actual o en el elemento con clase artist-album-item más cercano
                let albumId = el.data('album-id');

                if (!albumId) {
                    // Si no tiene data-album-id, buscar en el padre o en el elemento con clase artist-album-item
                    const artistAlbumItem = el.closest('.artist-album-item');
                    if (artistAlbumItem.length) {
                        albumId = artistAlbumItem.data('album-id');
                    }
                }

                if (!albumId) {
                    // Si aún no hay albumId, buscar en el album-card más cercano
                    const albumCard = el.closest('.album-card');
                    if (albumCard.length) {
                        albumId = albumCard.data('album-id');
                    }
                }

                if (!albumId) return;

                self.mostrarAlbum(albumId);
            });
        },

        cargarSongs() {
            $.get('/Music/ObtenerSongs', result => {
                if (result.esCorrecto) {
                    this.songs = result.data || [];
                    this.pintarSongs(this.songs);
                }
            });
        },

        cargarAlbums() {
            $.get('/Music/ObtenerAlbums', result => {
                if (result.esCorrecto) {
                    this.albums = result.data || [];
                    this.enriquecerAlbumsConArtistas();
                }
            });
        },

        cargarArtists() {
            $.get('/Music/ObtenerArtists', result => {
                if (result.esCorrecto) {
                    this.artists = result.data || [];
                    this.pintarArtists(this.artists);
                    this.enriquecerAlbumsConArtistas();
                }
            });
        },

        formatearDuracion(segundos) {
            if (!segundos || segundos <= 0) return '-';
            const min = Math.floor(segundos / 60);
            const sec = segundos % 60;
            return `${min}:${sec.toString().padStart(2, '0')}`;
        },

        pintarSongs(songs) {
            this.currentDisplayedSongs = songs || [];
            const grid = $('#songsGrid');
            grid.empty();

            songs.forEach(song => {
                const cover = song.coverImageUrl
                    || song.albumCoverImageUrl
                    || '/img/placeholder-album.avif';
                const artistName = song.artistName || 'Artista desconocido';
                const albumTitle = song.albumTitle || '';
                const albumId = song.albumId || '';

                // Construir el HTML del subtítulo: mostrar punto y álbum sólo si existe albumTitle
                let subtitleHtml = `<span class="music-card-artist" data-artist-id="${song.artistId || ''}" title="${artistName}">${artistName}</span>`;
                if (albumTitle && albumTitle.length > 0) {
                    subtitleHtml += ` <span class="music-card-dot">•</span> <span class="music-card-album" data-album-id="${albumId}" title="${albumTitle}">${albumTitle}</span>`;
                }

                const card = `
                    <div class="music-card" data-song-id="${song.songId}">
                        <div class="music-card-cover">
                            <div class="music-card-play-overlay"><i class="fas fa-play-circle"></i></div>
                            <img src="${cover}" alt="${albumTitle}" onerror="this.src='/img/placeholder-album.avif';" />
                        </div>
                        <div class="music-card-body">
                            <div class="music-card-title" title="${song.title}">${song.title}</div>
                            <div class="music-card-subtitle">
                                ${subtitleHtml}
                            </div>
                        </div>
                        <div class="music-card-duration">
                            ${this.formatearDuracion(song.duration)}
                        </div>
                    </div>`;
                grid.append(card);
            });
        },

        filtrar(termino) {
            const filtradasSongs = this.songs.filter(s => {
                const t = (s.title || '').toLowerCase();
                const a = (s.artistName || '').toLowerCase();
                return t.includes(termino) || a.includes(termino);
            });
            this.pintarSongs(filtradasSongs);

            const filtradosArtists = this.artists.filter(a =>
                a.name && a.name.toLowerCase().includes(termino)
            );
            this.pintarArtists(filtradosArtists);

            const filtradosAlbums = this.albums.filter(alb => {
                const title = (alb.title || '').toLowerCase();
                const artist = (alb.artistName || '').toLowerCase();
                return title.includes(termino) || artist.includes(termino);
            });
            this.pintarAlbums(filtradosAlbums);
        },

        pintarArtists(artists) {
            const contenedor = $('#listaArtistas');
            contenedor.empty();

            artists.forEach(artist => {
                const image = artist.imageUrl || '/img/placeholder-artist.png';
                const item = `
                    <div class="artist-card" data-artist-id="${artist.artistId || ''}">
                        <div class="artist-avatar">
                            <img src="${image}" alt="${artist.name}" onerror="this.src='/img/placeholder-artist.png';" />
                        </div>
                        <div class="artist-info">
                            <div class="artist-name" data-artist-id="${artist.artistId || ''}" title="${artist.name}">${artist.name}</div>
                            ${artist.biography ? `<div class="artist-bio">${artist.biography}</div>` : ''}
                        </div>
                    </div>`;
                contenedor.append(item);
            });
        },

        // Completa info de álbumes con datos de artistas ya cargados
        enriquecerAlbumsConArtistas() {
            if (!this.albums || this.albums.length === 0) return;

            this.albums = this.albums.map(album => {
                // Si ya tiene nombre de artista, lo respetamos
                if (album.artistName && album.artistName.length > 0) {
                    return album;
                }

                // Buscamos el artista por ArtistId
                const artist = this.artists.find(a => a.artistId === album.artistId);
                const artistName = artist ? artist.name : (album.artistName || '');

                return {
                    ...album,
                    artistName: artistName
                };
            });

            this.pintarAlbums(this.albums);
        },

        pintarAlbums(albums) {
            const contenedor = $('#listaAlbums');
            contenedor.empty();

            albums.forEach(album => {
                const image = album.coverImageUrl || '/img/placeholder-album.avif';
                const yearText = album.releaseYear ? `${album.releaseYear}` : '';
                const artistName = album.artistName || '';
                const subtitle =
                    artistName && yearText
                        ? `${artistName} · ${yearText}`
                        : (artistName || yearText || '');

                const item = `
                    <div class="album-card" data-album-id="${album.albumId}">
                        <div class="album-cover">
                            <img src="${image}" alt="${album.title}" onerror="this.src='/img/placeholder-album.avif';" />
                        </div>
                        <div class="album-info">
                            <div class="album-title" title="${album.title}">${album.title}</div>
                            <div class="album-subtitle text-secondary small">
                                ${subtitle}
                            </div>
                        </div>
                    </div>`;
                contenedor.append(item);
            });
        },

        mostrarArtist(artistId) {

            const artist = this.artists.find(a =>
                a.artistId == artistId || a.artistid == artistId || a.id == artistId
            );

            if (!artist) return;

            const image = artist.imageUrl || '/img/placeholder-artist.png';

            $('#artistModalName').text(artist.name);
            $('#artistModalBio').text(artist.biography || 'Sin biografía disponible');
            $('#artistModalImage').attr('src', image);

            // FILTRAR CANCIONES DEL ARTISTA
            const songs = this.songs.filter(s => s.artistId == artistId);

            const listSongs = $('#artistSongsList');
            listSongs.empty();

            if (songs.length === 0) {
                listSongs.append(`<li class="list-group-item text-secondary">No hay canciones</li>`);
            } else {
                songs.forEach(song => {

                    listSongs.append(`
                <li class="list-group-item d-flex justify-content-between">
                    <span>${song.title}</span>
                    <span class="text-secondary small">
                        ${this.formatearDuracion(song.duration)}
                    </span>
                </li>
            `);

                });
            }

            // FILTRAR ÁLBUMES DEL ARTISTA
            const albums = this.albums.filter(a => a.artistId == artistId);

            const listAlbums = $('#artistAlbumsList');
            listAlbums.empty();

            if (albums.length === 0) {
                listAlbums.append(`<li class="list-group-item text-secondary">No hay álbumes</li>`);
            } else {
                albums.forEach(album => {
                    const yearText = album.releaseYear ? ` (${album.releaseYear})` : '';
                    listAlbums.append(`
                <li class="list-group-item d-flex justify-content-between artist-album-item" data-album-id="${album.albumId}">
                    <span>${album.title}${yearText}</span>
                </li>
            `);
                });
            }

            const modal = new bootstrap.Modal(document.getElementById('artistModal'));
            modal.show();
        },

        mostrarAlbum(albumId) {
            const album = this.albums.find(a =>
                a.albumId == albumId
            );

            if (!album) return;

            const image = album.coverImageUrl || '/img/placeholder-album.avif';

            $('#albumModalTitle').text(album.title);
            $('#albumModalArtist').text(album.artistName || '');
            $('#albumModalYear').text(album.releaseYear ? `Año de lanzamiento: ${album.releaseYear}` : '');
            $('#albumModalImage').attr('src', image);

            const songs = this.songs.filter(s => s.albumId == album.albumId);

            const list = $('#albumSongsList');
            list.empty();

            if (songs.length === 0) {
                list.append(`<li class="list-group-item text-secondary">No hay canciones en este álbum</li>`);
            } else {
                songs.forEach(song => {
                    list.append(`
                <li class="list-group-item d-flex justify-content-between">
                    <span>${song.title}</span>
                    <span class="text-secondary small">
                        ${this.formatearDuracion(song.duration)}
                    </span>
                </li>
            `);
                });
            }

            const modal = new bootstrap.Modal(document.getElementById('albumModal'));
            modal.show();
        }
    };


    $(document).ready(() => Music.init());
    
    // Modal close handlers
    $(document).on('click', '#artistModalClose', () => {
        $('#artistModal').removeClass('active');
    });

    $(document).on('click', '#artistModal .crmp-modal-backdrop', () => {
        $('#artistModal').removeClass('active');
    });
})();

