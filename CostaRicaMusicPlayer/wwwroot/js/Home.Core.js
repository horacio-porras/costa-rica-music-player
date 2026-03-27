(() => {
    const Home = window.Home || (window.Home = {});

    Object.assign(Home, {
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
        filteredSongs: [],
        currentDisplayedSongs: [],
        pageSize: 9,
        currentPage: 1,
        isAuthenticated: false,
        selectedPlaylistId: null,
        modalAddSongsAll: [],

        init() {
            this.isAuthenticated = !!window.homeIsAuthenticated;
            this.cargarDatos();
            this.registrarEventos();
        },

        registrarEventos() {
            const self = this;

            $(document).on('click', '.artist-card, .artist-name, .music-card-artist', (e) => {
                const el = $(e.currentTarget);
                const artistId = el.data('artist-id') || el.closest('.artist-card').data('artist-id');
                if (!artistId) return;
                self.mostrarArtist(artistId);
            });

            $(document).on('click', '.music-card-add-playlist-btn', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                const songId = $(this).data('song-id');
                if (!songId || !window.Player) return;
                const song = self.currentDisplayedSongs.find(s => s.songId == songId);
                if (song) await window.Player.agregarCancionAPlaylist(song);
            });

            $(document).on('click', '#songsGrid .music-card', function (e) {
                if ($(e.target).closest('.music-card-artist, .music-card-album, .music-card-add-playlist-btn').length) return;
                const songId = $(this).data('song-id');
                if (songId && window.Player) {
                    const song = self.currentDisplayedSongs.find(s => s.songId == songId);
                    if (song) window.Player.reproducir(song, self.currentDisplayedSongs);
                }
            });

            $(document).on('click', '.album-card, .music-card-album, .artist-album-item', (e) => {
                const el = $(e.currentTarget);
                const albumId = el.data('album-id') || el.closest('.album-card').data('album-id');
                if (!albumId) return;
                self.mostrarAlbum(albumId);
            });

            $('#txtBuscarCancion').on('input', () => {
                const termino = ($('#txtBuscarCancion').val() || '').toLowerCase();
                self.aplicarFiltroCanciones(termino);
            });

            $(document).on('click', '#songsPagination .page-link', function (e) {
                e.preventDefault();
                const page = Number($(this).data('page'));
                if (!Number.isNaN(page) && page > 0) {
                    self.currentPage = page;
                    self.renderSongsPage();
                }
            });

            $(document).on('click', '#btnVolverHomeDiscovery', () => self.mostrarDiscovery());

            $(document).on('click', '.navbar-brand', function (e) {
                const ruta = (window.location.pathname || '').toLowerCase();
                const enHome = ruta === '/' || ruta === '/home' || ruta === '/home/index';
                if (!enHome) return;

                e.preventDefault();
                const detalleVisible = !$('#homePlaylistDetailContainer').hasClass('d-none');
                if (detalleVisible) self.mostrarDiscovery();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            document.addEventListener('playlist-song-added', (event) => {
                const playlistId = Number(event?.detail?.playlistId);
                if (!playlistId) return;
                self.actualizarContadorPlaylistSidebar(playlistId);
            });

            self.registrarEventosPlaylists();
        },

        cargarDatos() {
            Promise.all([
                this.cargarSongs(),
                this.cargarArtists(),
                this.cargarAlbums(),
                this.cargarPlaylists()
            ]).then(() => {
                this.aplicarFiltroCanciones('');
                this.pintarArtists(this.artists);
                this.enriquecerAlbumsConArtistas();
                this.mostrarSidebarPlaylists();
            });
        },

        formatearDuracion(segundos) {
            if (!segundos || segundos <= 0) return '-';
            const min = Math.floor(segundos / 60);
            const sec = segundos % 60;
            return `${min}:${sec.toString().padStart(2, '0')}`;
        },

        formatearDuracionTotal(totalSegundos) {
            if (totalSegundos <= 0) return '0 min';
            const horas = Math.floor(totalSegundos / 3600);
            const minutos = Math.floor((totalSegundos % 3600) / 60);
            return horas > 0 ? `${horas} h ${minutos} min` : `${minutos} min`;
        },

        parsearDuracion(texto) {
            const partes = String(texto || '').trim().split(':');
            if (partes.length !== 2) return 0;
            const min = Number(partes[0]);
            const sec = Number(partes[1]);
            if (Number.isNaN(min) || Number.isNaN(sec)) return 0;
            return (min * 60) + sec;
        },

        normalizarRutaImagen(url) {
            if (!url) return '/img/placeholder-cover.png';
            if (/^https?:\/\//i.test(url)) return url;
            const normalizada = String(url).replace(/\\/g, '/').trim();
            return normalizada.startsWith('/') ? normalizada : `/${normalizada}`;
        },

        tienePortadaPersonalizada(url) {
            if (!url) return false;
            return !url.includes('placeholder-playlist')
                && !url.includes('placeholder-album')
                && !url.includes('placeholder-cover');
        },

        escapeHtml(texto) {
            return String(texto || '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }
    });
})();
