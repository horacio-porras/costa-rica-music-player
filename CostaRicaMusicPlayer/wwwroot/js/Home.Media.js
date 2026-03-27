(() => {
    const Home = window.Home || (window.Home = {});

    Object.assign(Home, {
        cargarAlbums() {
            return $.get('/Music/ObtenerAlbums', result => {
                if (result.esCorrecto) {
                    this.albums = result.data || [];
                }
            });
        },

        cargarArtists() {
            return $.get('/Music/ObtenerArtists', result => {
                if (result.esCorrecto) {
                    this.artists = result.data || [];
                }
            });
        },

        pintarArtists(artists) {
            const contenedor = $('#listaArtistas');
            contenedor.empty();

            if (!artists || artists.length === 0) {
                contenedor.append('<div class="text-secondary">No hay artistas disponibles</div>');
                return;
            }

            artists.forEach(artist => {
                const image = artist.imageUrl || '/img/placeholder-artist.png';
                const card = `
                    <div class="artist-card" data-artist-id="${artist.artistId || artist.id || ''}">
                        <div class="artist-avatar">
                            <img src="${image}" alt="${artist.name}" onerror="this.src='/img/placeholder-artist.png';" />
                        </div>
                        <div class="artist-info">
                            <div class="artist-name" data-artist-id="${artist.artistId || artist.id || ''}" title="${artist.name}">${artist.name}</div>
                        </div>
                    </div>`;
                contenedor.append(card);
            });
        },

        enriquecerAlbumsConArtistas() {
            if (!this.albums || this.albums.length === 0) return;

            this.albums = this.albums.map(album => {
                if (album.artistName && album.artistName.length > 0) return album;
                const artist = this.artists.find(a => a.artistId === album.artistId);
                return { ...album, artistName: artist ? artist.name : (album.artistName || '') };
            });

            this.pintarAlbums(this.albums);
        },

        pintarAlbums(albums) {
            const contenedor = $('#listaAlbums');
            contenedor.empty();

            if (!albums || albums.length === 0) {
                contenedor.append('<div class="text-secondary">No hay álbumes disponibles</div>');
                return;
            }

            albums.forEach(album => {
                const image = album.coverImageUrl || '/img/placeholder-album.avif';
                const yearText = album.releaseYear ? `${album.releaseYear}` : '';
                const artistName = album.artistName || '';
                const subtitle = artistName && yearText
                    ? `${artistName} · ${yearText}`
                    : (artistName || yearText || '');

                const item = `
                    <div class="album-card" data-album-id="${album.albumId}">
                        <div class="album-cover">
                            <img src="${image}" alt="${album.title}" onerror="this.src='/img/placeholder-album.avif';" />
                        </div>
                        <div class="album-info">
                            <div class="album-title" title="${album.title}">${album.title}</div>
                            <div class="album-subtitle text-secondary small">${subtitle}</div>
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

            const songs = this.songs.filter(s => s.artistId == artistId);
            const listSongs = $('#artistSongsList');
            listSongs.empty();

            if (songs.length === 0) {
                listSongs.append('<li class="list-group-item text-secondary">No hay canciones</li>');
            } else {
                $('#artistModal').data('modal-songs', songs);
                songs.forEach((song, index) => {
                    listSongs.append(`
                        <li class="list-group-item d-flex justify-content-between align-items-center media-modal-song-item" data-song-index="${index}">
                            <div class="d-flex flex-grow-1 align-items-center media-modal-song-play" style="cursor:pointer;min-width:0;">
                                <span class="text-truncate">${this.escapeHtml(song.title || 'Sin título')}</span>
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

            const albums = this.albums.filter(a => a.artistId == artistId);
            const listAlbums = $('#artistAlbumsList');
            listAlbums.empty();
            if (albums.length === 0) {
                listAlbums.append('<li class="list-group-item text-secondary">No hay álbumes</li>');
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
            const album = this.albums.find(a => a.albumId == albumId);
            if (!album) return;

            const image = album.coverImageUrl || '/img/placeholder-album.avif';
            $('#albumModalTitle').text(album.title);

            let artistName = album.artistName || '';
            if (!artistName && album.artistId) {
                const artist = this.artists.find(a => a.artistId == album.artistId);
                if (artist) artistName = artist.name;
            }

            $('#albumModalArtist').text(artistName || '');
            $('#albumModalYear').text(album.releaseYear ? `Año de lanzamiento: ${album.releaseYear}` : '');
            $('#albumModalImage').attr('src', image);

            const songs = this.songs.filter(s => s.albumId == album.albumId);
            const list = $('#albumSongsList');
            list.empty();
            if (songs.length === 0) {
                list.append('<li class="list-group-item text-secondary">No hay canciones en este álbum</li>');
            } else {
                $('#albumModal').data('modal-songs', songs);
                songs.forEach((song, index) => {
                    list.append(`
                        <li class="list-group-item d-flex justify-content-between align-items-center media-modal-song-item" data-song-index="${index}">
                            <div class="d-flex flex-grow-1 align-items-center media-modal-song-play" style="cursor:pointer;min-width:0;">
                                <span class="text-truncate">${this.escapeHtml(song.title || 'Sin título')}</span>
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
    });
})();
