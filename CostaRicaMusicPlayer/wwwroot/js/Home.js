(() => {
    const Home = {
        songs: [],
        artists: [],
        playlists: [],

        init() {
            this.cargarDatos();
            this.registrarEventos();
        },

        registrarEventos() {
            const self = this;

            // Delegación de eventos para artistas
            $(document).on('click', '.artist-card, .artist-name', (e) => {
                const el = $(e.currentTarget);
                const artistId = el.data('artist-id') || el.closest('.artist-card').data('artist-id');
                if (!artistId) return;
                self.mostrarArtist(artistId);
            });
        },

        cargarDatos() {
            // Cargar todos los datos necesarios
            Promise.all([
                this.cargarSongs(),
                this.cargarArtists(),
                this.cargarPlaylists()
            ]).then(() => {
                // Una vez cargados todos, mostrar los elementos aleatorios
                this.mostrarCancionesRecomendadas();
                this.mostrarArtistasRecomendados();
                this.mostrarPlaylistsRecientes();
            });
        },

        cargarSongs() {
            return $.get('/Music/ObtenerSongs', result => {
                if (result.esCorrecto) {
                    this.songs = result.data || [];
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

        cargarPlaylists() {
            // Asumiendo que tienes un endpoint similar para playlists
            return $.get('/Playlists/ObtenerPlaylists', result => {
                if (result.esCorrecto) {
                    this.playlists = result.data || [];
                }
            }).fail(() => {
                // Si no existe el endpoint, crear datos de ejemplo
                this.playlists = this.generarPlaylistsEjemplo();
            });
        },

        
        obtenerElementosAleatorios(array, cantidad) {
            if (!array || array.length === 0) return [];

            // Mezclar array y tomar los primeros 'cantidad'
            const mezclado = [...array].sort(() => Math.random() - 0.5);
            return mezclado.slice(0, Math.min(cantidad, array.length));
        },

        mostrarPlaylistsRecientes() {
            const grid = $('#playlistsGrid');
            grid.empty();

            // Tomar las últimas 4 playlists (o todas si hay menos)
            const playlistsMostrar = this.playlists.slice(0, 8);

            if (playlistsMostrar.length === 0) {
                grid.append('<div class="text-secondary">No hay playlists disponibles</div>');
                return;
            }

            playlistsMostrar.forEach(playlist => {
                const cover = playlist.coverImageUrl || '/img/placeholder-playlist.avif';
                const card = `
                    <div class="playlist-card" data-playlist-id="${playlist.playlistId || playlist.id}">
                        <div class="playlist-card-cover">
                            <img src="${cover}" alt="${playlist.name}" onerror="this.src='/img/placeholder-artist.png';" />
                            <div class="playlist-overlay">
                                <i class="bi bi-play-circle-fill"></i>
                            </div>
                        </div>
                        <div class="playlist-card-body">
                            <div class="playlist-card-title" title="${playlist.name}">${playlist.name}</div>
                            <div class="playlist-card-subtitle">${playlist.description || 'Playlist'}</div>
                            <div class="playlist-card-meta">${playlist.songCount || 0} canciones</div>
                        </div>
                    </div>`;
                grid.append(card);
            });
        },

        mostrarCancionesRecomendadas() {
            const grid = $('#recommendedSongsGrid');
            grid.empty();

            const cancionesRandom = this.obtenerElementosAleatorios(this.songs, 8);

            if (cancionesRandom.length === 0) {
                grid.append('<div class="text-secondary">No hay canciones disponibles</div>');
                return;
            }

            cancionesRandom.forEach(song => {
                const cover = song.coverImageUrl || song.albumCoverImageUrl || '/img/placeholder-album.avif';
                const artistName = song.artistName || 'Artista desconocido';

                const card = `
                    <div class="music-card">
                        <div class="music-card-cover">
                            <img src="${cover}" alt="${song.title}" onerror="this.src='/img/placeholder-album.avif';" />
                        </div>
                        <div class="music-card-body">
                            <div class="music-card-title" title="${song.title}">${song.title}</div>
                            <div class="music-card-subtitle">
                                <span class="music-card-artist" data-artist-id="${song.artistId || ''}" title="${artistName}">${artistName}</span>
                            </div>
                        </div>
                        <div class="music-card-duration">
                            ${this.formatearDuracion(song.duration)}
                        </div>
                    </div>`;
                grid.append(card);
            });
        },

        mostrarArtistasRecomendados() {
            const grid = $('#recommendedArtistsGrid');
            grid.empty();

            const artistasRandom = this.obtenerElementosAleatorios(this.artists, 6);

            if (artistasRandom.length === 0) {
                grid.append('<div class="text-secondary">No hay artistas disponibles</div>');
                return;
            }

            artistasRandom.forEach(artist => {
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
                grid.append(card);
            });
        },

        formatearDuracion(segundos) {
            if (!segundos || segundos <= 0) return '-';
            const min = Math.floor(segundos / 60);
            const sec = segundos % 60;
            return `${min}:${sec.toString().padStart(2, '0')}`;
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

            // Filtrar canciones del artista
            const songs = this.songs.filter(s => s.artistId == artistId);

            const list = $('#artistSongsList');
            list.empty();

            if (songs.length === 0) {
                list.append('<li class="list-group-item text-secondary">No hay canciones</li>');
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

            const modal = new bootstrap.Modal(document.getElementById('artistModal'));
            modal.show();
        }
    };

    $(document).ready(() => Home.init());
})();