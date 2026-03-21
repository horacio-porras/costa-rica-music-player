(() => {
    const Music = {
        songs: [],
        artists: [],
        albums: [],
        currentDisplayedSongs: [],
        filteredSongs: [],
        pageSize: 10,
        currentPage: 1,

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

            $(document).on('click', '.music-card-add-playlist-btn', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                const songId = $(this).data('song-id');
                if (!songId || !window.Player) return;
                const song = self.currentDisplayedSongs.find(s => s.songId == songId);
                if (song) await window.Player.agregarCancionAPlaylist(song);
            });

            $(document).on('click', '.music-card', function(e) {
                if ($(e.target).closest('.music-card-artist, .music-card-album, .music-card-add-playlist-btn').length) return;
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

            $(document).on('click', '#songsPagination .page-link', function (e) {
                e.preventDefault();
                const page = Number($(this).data('page'));
                if (!Number.isNaN(page) && page > 0) {
                    self.currentPage = page;
                    self.renderSongsPage();
                }
            });
        },

        cargarSongs() {
            $.get('/Music/ObtenerSongs', result => {
                if (result.esCorrecto) {
                    this.songs = result.data || [];
                    this.filteredSongs = [...this.songs];
                    this.currentDisplayedSongs = [...this.filteredSongs];
                    this.currentPage = 1;
                    this.renderSongsPage();
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
            const grid = $('#songsGrid');
            grid.empty();

            songs.forEach(song => {
                const cover = song.coverImageUrl
                    || song.albumCoverImageUrl
                    || '/img/placeholder-album.avif';
                const artistName = song.artistName || 'Artista desconocido';
                const albumTitle = song.albumTitle || '';
                const albumId = song.albumId || '';

                // Construir el HTML del subtítulo: artista y álbum en líneas separadas
                let subtitleHtml = `<span class="music-card-artist" data-artist-id="${song.artistId || ''}" title="${artistName}">${artistName}</span>`;
                if (albumTitle && albumTitle.length > 0) {
                    subtitleHtml += `<span class="music-card-album" data-album-id="${albumId}" title="${albumTitle}">${albumTitle}</span>`;
                }

                const card = `
                    <div class="music-card" data-song-id="${song.songId}">
                        <div class="music-card-cover">
                            <button type="button" class="music-card-add-playlist-btn" title="Agregar a playlist" aria-label="Agregar a playlist" data-song-id="${song.songId}">
                                <i class="fas fa-plus"></i>
                            </button>
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

        renderSongsPage() {
            const total = this.filteredSongs.length;
            const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
            this.currentPage = Math.min(Math.max(1, this.currentPage), totalPages);

            const start = (this.currentPage - 1) * this.pageSize;
            const pageSongs = this.filteredSongs.slice(start, start + this.pageSize);

            this.currentDisplayedSongs = [...this.filteredSongs];
            this.pintarSongs(pageSongs);
            this.renderSongsPagination(totalPages, total, start);
        },

        renderSongsPagination(totalPages, totalSongs, startIndex) {
            const ul = $('#songsPagination');
            const info = $('#songsPaginationInfo');
            ul.empty();

            if (totalSongs === 0) {
                info.text('0 canciones');
                return;
            }

            const endIndex = Math.min(startIndex + this.pageSize, totalSongs);
            info.text(`Mostrando ${startIndex + 1}-${endIndex} de ${totalSongs} canciones`);

            const prevDisabled = this.currentPage === 1 ? ' disabled' : '';
            ul.append(`
                <li class="page-item${prevDisabled}">
                    <a class="page-link" href="#" data-page="${this.currentPage - 1}" aria-label="Anterior">&laquo;</a>
                </li>
            `);

            const maxPagesToShow = 5;
            const half = Math.floor(maxPagesToShow / 2);
            let startPage = Math.max(1, this.currentPage - half);
            let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
            if (endPage - startPage + 1 < maxPagesToShow) {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }

            for (let page = startPage; page <= endPage; page++) {
                const active = page === this.currentPage ? ' active' : '';
                ul.append(`
                    <li class="page-item${active}">
                        <a class="page-link" href="#" data-page="${page}">${page}</a>
                    </li>
                `);
            }

            const nextDisabled = this.currentPage === totalPages ? ' disabled' : '';
            ul.append(`
                <li class="page-item${nextDisabled}">
                    <a class="page-link" href="#" data-page="${this.currentPage + 1}" aria-label="Siguiente">&raquo;</a>
                </li>
            `);
        },

        filtrar(termino) {
            const filtradasSongs = this.songs.filter(s => {
                const t = (s.title || '').toLowerCase();
                const a = (s.artistName || '').toLowerCase();
                return t.includes(termino) || a.includes(termino);
            });
            this.filteredSongs = filtradasSongs;
            this.currentPage = 1;
            this.renderSongsPage();

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
                $('#artistModal').data('modal-songs', songs);
                songs.forEach((song, index) => {
                    const safeTitle = (song.title || 'Sin título').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                    listSongs.append(`
                <li class="list-group-item d-flex justify-content-between align-items-center media-modal-song-item" data-song-index="${index}">
                    <div class="d-flex flex-grow-1 align-items-center media-modal-song-play" style="cursor:pointer;min-width:0;">
                        <span class="text-truncate">${safeTitle}</span>
                    </div>
                    <span class="text-secondary small flex-shrink-0">${this.formatearDuracion(song.duration)}</span>
                    <div class="dropdown flex-shrink-0 ms-2" data-song-index="${index}">
                        <button type="button" class="btn btn-link btn-sm p-0 text-secondary media-modal-more-btn" data-bs-toggle="dropdown" title="Más opciones" aria-label="Más opciones"><i class="fas fa-ellipsis-h"></i></button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><button type="button" class="dropdown-item media-modal-add-to-playlist" data-song-index="${index}"><i class="fas fa-plus me-2"></i>Agregar a playlist</button></li>
                        </ul>
                    </div>
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
                $('#albumModal').data('modal-songs', songs);
                songs.forEach((song, index) => {
                    const safeTitle = (song.title || 'Sin título').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                    list.append(`
                <li class="list-group-item d-flex justify-content-between align-items-center media-modal-song-item" data-song-index="${index}">
                    <div class="d-flex flex-grow-1 align-items-center media-modal-song-play" style="cursor:pointer;min-width:0;">
                        <span class="text-truncate">${safeTitle}</span>
                    </div>
                    <span class="text-secondary small flex-shrink-0">${this.formatearDuracion(song.duration)}</span>
                    <div class="dropdown flex-shrink-0 ms-2" data-song-index="${index}">
                        <button type="button" class="btn btn-link btn-sm p-0 text-secondary media-modal-more-btn" data-bs-toggle="dropdown" title="Más opciones" aria-label="Más opciones"><i class="fas fa-ellipsis-h"></i></button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><button type="button" class="dropdown-item media-modal-add-to-playlist" data-song-index="${index}"><i class="fas fa-plus me-2"></i>Agregar a playlist</button></li>
                        </ul>
                    </div>
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

