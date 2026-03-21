(() => {
    const Home = {
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

        init() {
            this.isAuthenticated = !!window.homeIsAuthenticated;
            this.cargarDatos();
            this.registrarEventos();
        },

        registrarEventos() {
            const self = this;

            // Delegación de eventos para artistas
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

            // Reproducir canción al hacer clic en la card (excepto en artista/álbum)
            $(document).on('click', '#songsGrid .music-card', function(e) {
                if ($(e.target).closest('.music-card-artist, .music-card-album, .music-card-add-playlist-btn').length) return;
                const card = $(this);
                const songId = card.data('song-id');
                if (songId && window.Player) {
                    const song = self.currentDisplayedSongs.find(s => s.songId == songId);
                    if (song) window.Player.reproducir(song, self.currentDisplayedSongs);
                }
            });

            // Delegación de eventos para álbumes (en cards y en listas)
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

            $(document).on('click', '.home-library-item', function (event) {
                if ($(event.target).closest('.home-library-item-actions, .home-library-item-action-btn').length) {
                    return;
                }
                if ($(event.target).closest('.home-library-item-cover-wrap').length) {
                    return;
                }
                const playlistId = $(this).data('playlist-id');
                if (!playlistId) return;
                $('.home-library-item').removeClass('is-active');
                $(this).addClass('is-active');
                self.selectedPlaylistId = Number(playlistId);
                self.cargarDetallePlaylistEmbebido(playlistId);
            });

            $(document).on('click', '.home-library-item-cover-wrap', async function (event) {
                event.preventDefault();
                event.stopPropagation();
                const playlistId = $(this).closest('.home-library-item').data('playlist-id');
                if (!playlistId) return;
                await self.reproducirPlaylistDesdeSidebar(playlistId);
            });

            $(document).on('click', '.home-library-item-action-btn.btn-edit', function (event) {
                event.preventDefault();
                event.stopPropagation();
                const playlistId = $(this).closest('.home-library-item').data('playlist-id');
                if (!playlistId) return;
                self.cargarPlaylistEnModalEditar(playlistId);
            });

            $(document).on('click', '.home-library-item-action-btn.btn-delete', function (event) {
                event.preventDefault();
                event.stopPropagation();
                const playlistId = $(this).closest('.home-library-item').data('playlist-id');
                if (!playlistId) return;
                self.eliminarPlaylistDesdeSidebar(playlistId);
            });

            $(document).on('click', '#homePlaylistDetailContainer .js-playlist-cover-edit', function (event) {
                event.preventDefault();
                const playlistId = Number($(this).attr('data-playlist-id'));
                if (!playlistId) return;
                self.cargarPlaylistEnModalEditar(playlistId);
            });

            $('#btnGuardarPlaylist').on('click', (event) => {
                event.preventDefault();
                self.guardarPlaylistDesdeSidebar();
            });

            $('#btnEditarPlaylist').on('click', (event) => {
                event.preventDefault();
                self.editarPlaylistDesdeSidebar();
            });

            $(document).on('click', '.js-home-create-playlist', async function (event) {
                event.preventDefault();
                if (self.isAuthenticated) {
                    $('#modalCrearPlaylist').modal('show');
                    return;
                }

                await self.mostrarAvisoLoginCrearPlaylist();
            });

            $('#modalCrearPlaylist').on('show.bs.modal', async function (event) {
                if (self.isAuthenticated) {
                    return;
                }
                event.preventDefault();
                await self.mostrarAvisoLoginCrearPlaylist();
            });

            $(document).on('click', '#btnVolverHomeDiscovery', function () {
                self.mostrarDiscovery();
            });

            $(document).on('click', '.navbar-brand', function (e) {
                const ruta = (window.location.pathname || '').toLowerCase();
                const enHome = ruta === '/' || ruta === '/home' || ruta === '/home/index';
                if (!enHome) {
                    return;
                }

                // En Home evitamos recargar: si hay playlist abierta, volvemos al modo discovery.
                e.preventDefault();
                const detalleVisible = !$('#homePlaylistDetailContainer').hasClass('d-none');
                if (detalleVisible) {
                    self.mostrarDiscovery();
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            $(document).on('click', '#homePlaylistDetailContainer .playlist-song-row', function (e) {
                if ($(e.target).closest('.playlist-track-play-btn, .playlist-row-actions, .playlist-more-btn, .dropdown-menu').length) {
                    return;
                }

                const row = $(this);
                const playlistSongs = $('#homePlaylistDetailContainer').data('playlist-songs') || [];
                const song = self.obtenerCancionDesdeFila(row, playlistSongs);
                if (song && window.Player) {
                    window.Player.reproducir(song, playlistSongs);
                }
            });

            $(document).on('click', '#homePlaylistDetailContainer .playlist-track-play-btn', function () {
                const row = $(this).closest('.playlist-song-row');
                const playlistSongs = $('#homePlaylistDetailContainer').data('playlist-songs') || [];
                const song = self.obtenerCancionDesdeFila(row, playlistSongs);
                if (song && window.Player) {
                    window.Player.reproducir(song, playlistSongs);
                }
            });

            $(document).on('click', '#homePlaylistDetailContainer .playlist-remove-song-option', async function (event) {
                event.preventDefault();
                const playlistId = Number($(this).attr('data-playlist-id'));
                const songId = Number($(this).attr('data-song-id'));
                if (!playlistId || !songId) {
                    return;
                }
                await self.eliminarCancionDePlaylistEmbebida(playlistId, songId);
            });

            document.addEventListener('playlist-song-added', (event) => {
                const playlistId = Number(event?.detail?.playlistId);
                if (!playlistId) return;
                self.actualizarContadorPlaylistSidebar(playlistId);
            });

            $(document).on('click', '.js-add-songs-to-playlist', function (e) {
                e.preventDefault();
                const playlistId = Number($(this).data('playlist-id'));
                const playlistName = $(this).data('playlist-name') || 'Playlist';
                if (!playlistId) return;
                self.abrirModalAgregarCanciones(playlistId, playlistName);
            });

            $('#modalAddSongsSearch').on('input', function () {
                const termino = ($(this).val() || '').toLowerCase();
                self.filtrarModalAgregarCanciones(termino);
            });

            $(document).on('click', '.add-songs-modal-add-btn', async function (e) {
                e.preventDefault();
                const btn = $(this);
                if (btn.prop('disabled')) return;
                const songId = Number(btn.data('song-id'));
                const playlistId = Number($('#modalAddSongsToPlaylist').data('playlist-id'));
                if (!songId || !playlistId) return;
                await self.agregarCancionDesdeModal(playlistId, songId, btn);
            });
        },

        cargarDatos() {
            // Cargar todos los datos necesarios
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

        cargarSongs() {
            return $.get('/Music/ObtenerSongs', result => {
                if (result.esCorrecto) {
                    this.songs = result.data || [];
                    this.filteredSongs = [...this.songs];
                    this.currentDisplayedSongs = [...this.filteredSongs];
                }
            });
        },

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

        cargarPlaylists() {
            return $.get('/Playlists/ObtenerPlaylists', result => {
                if (result.esCorrecto) {
                    this.playlists = result.data || [];
                }
            }).fail((xhr) => {
                // Visitante no autenticado: mostrar estado vacío orientado a iniciar sesión
                if (xhr && xhr.status === 401) {
                    this.isAuthenticated = false;
                }
                this.playlists = [];
            });
        },

        
        obtenerElementosAleatorios(array, cantidad) {
            if (!array || array.length === 0) return [];

            // Mezclar array y tomar los primeros 'cantidad'
            const mezclado = [...array].sort(() => Math.random() - 0.5);
            return mezclado.slice(0, Math.min(cantidad, array.length));
        },

        mostrarSidebarPlaylists() {
            const list = $('#userLibraryList');
            const createBtn = $('.home-library-create-btn');
            list.empty();

            if (!this.playlists || this.playlists.length === 0) {
                if (!this.isAuthenticated) {
                    createBtn.removeClass('d-none');
                    list.append(`
                        <div class="home-library-empty-card">
                            <h5>Inicia sesión para ver tu biblioteca</h5>
                            <p>Accede a tus playlists y crea nuevas colecciones.</p>
                            <a href="/Account/Login" class="home-library-pill-btn">Iniciar sesión</a>
                        </div>
                    `);
                    return;
                }

                createBtn.removeClass('d-none');
                list.append(`
                    <div class="home-library-empty-card">
                        <h5>Crea tu primera playlist</h5>
                        <p>Organiza tus canciones favoritas en tu biblioteca.</p>
                        <button type="button" class="home-library-pill-btn border-0 js-home-create-playlist">Crear playlist</button>
                    </div>
                `);
                return;
            }

            createBtn.removeClass('d-none');
            this.playlists.forEach(playlist => {
                const songCount = Number(playlist.songCount || 0);
                const tienePortada = this.tienePortadaPersonalizada(playlist.coverImageUrl);
                const coverImage = this.normalizarRutaImagen(playlist.coverImageUrl || '/img/placeholder-cover.png');
                const thumbs = Array.isArray(playlist.thumbnailImages) ? playlist.thumbnailImages : [];
                const collageSources = [0, 1, 2, 3].map(i => this.normalizarRutaImagen(thumbs[i] || '/img/placeholder-cover.png'));
                const usarCollage = !tienePortada && songCount > 0 && thumbs.length > 0;
                const coverMarkup = usarCollage
                    ? `
                        <div class="home-library-cover-collage">
                            ${collageSources.map(src => `
                                <img src="${src}" class="home-library-cover-collage-item"
                                     alt="${playlist.name}"
                                     onerror="this.onerror=null;this.src='/img/placeholder-cover.png';" />
                            `).join('')}
                        </div>
                    `
                    : `
                        <img src="${coverImage}" alt="${playlist.name}" class="home-library-item-cover"
                             onerror="this.onerror=null;this.src='/img/placeholder-cover.png';" />
                    `;
                list.append(`
                    <div class="home-library-item" data-playlist-id="${playlist.playlistId}">
                        <div class="home-library-item-cover-wrap">
                            ${coverMarkup}
                            <span class="home-library-play-overlay" aria-hidden="true">
                                <i class="fas fa-play"></i>
                            </span>
                        </div>
                        <div class="home-library-item-text">
                            <div class="home-library-item-title" title="${playlist.name}">${playlist.name}</div>
                            <div class="home-library-item-meta">${playlist.songCount || 0} canciones</div>
                        </div>
                        <div class="home-library-item-actions">
                            <button type="button" class="home-library-item-action-btn btn-edit" title="Editar playlist" aria-label="Editar playlist">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button type="button" class="home-library-item-action-btn btn-delete" title="Eliminar playlist" aria-label="Eliminar playlist">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `);
            });

        },

        actualizarContadorPlaylistSidebar(playlistId) {
            const playlist = this.playlists.find(p => Number(p.playlistId) === Number(playlistId));
            if (!playlist) {
                return;
            }

            playlist.songCount = Number(playlist.songCount || 0) + 1;

            const item = $(`.home-library-item[data-playlist-id="${playlistId}"]`);
            if (item.length > 0) {
                item.find('.home-library-item-meta').text(`${playlist.songCount} canciones`);
            }
        },

        obtenerCancionDesdeFila(row, playlistSongs) {
            const songId = Number(row.attr('data-song-id'));
            const songIndex = Number(row.attr('data-song-index'));
            const songById = playlistSongs.find(s => Number(s.songId) === songId);
            const songByIndex = Number.isNaN(songIndex) ? null : (playlistSongs[songIndex] || null);
            if (songById || songByIndex) {
                return songById || songByIndex;
            }

            if (!songId || songId <= 0) {
                return null;
            }

            const title = row.find('.playlist-song-title').first().text().trim() || 'Sin titulo';
            const artistName = row.find('.playlist-song-artist').first().text().trim() || 'Artista desconocido';
            const coverImageUrl = this.normalizarRutaImagen(row.find('.playlist-song-cover').attr('src') || '/img/placeholder-cover.png');
            const durationText = row.find('td.text-end').first().text().trim();
            const duration = this.parsearDuracion(durationText);

            return {
                songId,
                title,
                artistName,
                coverImageUrl,
                duration,
                filePath: ''
            };
        },

        parsearDuracion(texto) {
            const partes = String(texto || '').trim().split(':');
            if (partes.length !== 2) {
                return 0;
            }
            const min = Number(partes[0]);
            const sec = Number(partes[1]);
            if (Number.isNaN(min) || Number.isNaN(sec)) {
                return 0;
            }
            return (min * 60) + sec;
        },

        async mostrarAvisoLoginCrearPlaylist() {
            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    title: 'Necesitas iniciar sesion',
                    text: 'Debes iniciar sesion para crear playlists.',
                    icon: 'info',
                    background: '#232323',
                    color: '#f3f3f3',
                    showCancelButton: true,
                    reverseButtons: true,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'playlist-swal-popup',
                        confirmButton: 'playlist-swal-confirm',
                        cancelButton: 'playlist-swal-cancel'
                    },
                    confirmButtonText: 'Ir a Login',
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    window.location.href = '/Account/Login';
                }
                return;
            }

            alert('Debes iniciar sesion para crear playlists.');
        },

        cargarPlaylistEnModalEditar(playlistId) {
            $.get(`/Playlists/ObtenerPlaylistPorId?id=${playlistId}`, result => {
                if (!result || result.codigoStatus === 401) {
                    window.location.href = '/Account/Login';
                    return;
                }
                if (!result.esCorrecto || !result.data) {
                    alert('No se pudo cargar la playlist.');
                    return;
                }

                if (typeof window.cargarPlaylistEnModal === 'function') {
                    window.cargarPlaylistEnModal(result.data);
                }
                $('#modalEditarPlaylist').modal('show');
            }).fail(() => {
                alert('Error al cargar la playlist.');
            });
        },

        guardarPlaylistDesdeSidebar() {
            const form = $('#formCrearPlaylist');
            if (!form.length) return;
            if (form.valid && !form.valid()) return;

            const formData = new FormData(form[0]);

            $.ajax({
                url: form.attr('action'),
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: (response) => {
                    if (!response || response.codigoStatus === 401) {
                        window.location.href = '/Account/Login';
                        return;
                    }
                    if (!response.esCorrecto) {
                        alert(response.mensaje || 'No se pudo crear la playlist.');
                        return;
                    }

                    $('#modalCrearPlaylist').modal('hide');
                    form[0].reset();
                    $('#previewImagen').attr('src', '/img/placeholder-cover.png');
                    this.recargarSidebarYDetalle();
                },
                error: () => alert('Error de conexión al crear la playlist.')
            });
        },

        editarPlaylistDesdeSidebar() {
            const form = $('#formEditarPlaylist');
            if (!form.length) return;
            if (form.valid && !form.valid()) return;

            const formData = new FormData(form[0]);
            const playlistId = Number($('#PlaylistId').val());

            $.ajax({
                url: form.attr('action'),
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: (response) => {
                    if (!response || response.codigoStatus === 401) {
                        window.location.href = '/Account/Login';
                        return;
                    }
                    if (!response.esCorrecto) {
                        alert(response.mensaje || 'No se pudo actualizar la playlist.');
                        return;
                    }

                    $('#modalEditarPlaylist').modal('hide');
                    form[0].reset();
                    $('#previewImagenActual').attr('src', '/img/placeholder-cover.png');
                    $('#nombreImagenActual').text('Sin imagen');
                    this.recargarSidebarYDetalle(playlistId || this.selectedPlaylistId);
                },
                error: () => alert('Error de conexión al actualizar la playlist.')
            });
        },

        async eliminarPlaylistDesdeSidebar(playlistId) {
            let confirmado = false;
            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    title: 'Eliminar playlist',
                    text: 'Esta accion no se puede deshacer.',
                    icon: undefined,
                    background: '#232323',
                    color: '#f3f3f3',
                    showCancelButton: true,
                    reverseButtons: true,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'playlist-swal-popup',
                        confirmButton: 'playlist-swal-confirm',
                        cancelButton: 'playlist-swal-cancel'
                    },
                    confirmButtonText: 'Si, eliminar',
                    cancelButtonText: 'Cancelar'
                });
                confirmado = !!result.isConfirmed;
            } else {
                confirmado = confirm('Esta accion no se puede deshacer. ¿Eliminar playlist?');
            }

            if (!confirmado) return;

            $.ajax({
                url: '/Playlists/EliminarPlaylist',
                type: 'POST',
                data: { id: playlistId },
                success: (response) => {
                    if (!response || response.codigoStatus === 401) {
                        window.location.href = '/Account/Login';
                        return;
                    }
                    if (!response.esCorrecto) {
                        alert(response.mensaje || 'No se pudo eliminar la playlist.');
                        return;
                    }

                    if (Number(this.selectedPlaylistId) === Number(playlistId)) {
                        this.selectedPlaylistId = null;
                        this.mostrarDiscovery();
                    }
                    this.recargarSidebarYDetalle();
                },
                error: () => alert('Error de conexión al eliminar la playlist.')
            });
        },

        recargarSidebarYDetalle(playlistIdPreferido = null) {
            this.cargarPlaylists().then(() => {
                this.mostrarSidebarPlaylists();

                const targetId = Number(playlistIdPreferido || this.selectedPlaylistId || 0);
                if (!targetId) return;

                const existe = this.playlists.some(p => Number(p.playlistId) === targetId);
                if (!existe) {
                    this.selectedPlaylistId = null;
                    this.mostrarDiscovery();
                    return;
                }

                this.selectedPlaylistId = targetId;
                $(`.home-library-item[data-playlist-id="${targetId}"]`).addClass('is-active');

                const detalleVisible = !$('#homePlaylistDetailContainer').hasClass('d-none');
                if (detalleVisible) {
                    this.cargarDetallePlaylistEmbebido(targetId);
                }
            });
        },

        async cargarDetallePlaylistEmbebido(playlistId) {
            if (!this.isAuthenticated) {
                return;
            }
            this.selectedPlaylistId = Number(playlistId);

            try {
                const result = await $.get(`/Playlists/ObtenerDetallePlaylist?id=${playlistId}`);
                if (!result || !result.esCorrecto || !result.data) {
                    return;
                }

                this.renderizarDetallePlaylistEmbebido(result.data);
            } catch (error) {
                // Sesion vencida o error de red
                console.error(error);
            }
        },

        async reproducirPlaylistDesdeSidebar(playlistId) {
            if (!this.isAuthenticated) {
                if (typeof Swal !== 'undefined') {
                    await Swal.fire({
                        title: 'Necesitas iniciar sesion',
                        text: 'Inicia sesion para reproducir playlists guardadas.',
                        icon: 'info',
                        background: '#232323',
                        color: '#f3f3f3',
                        confirmButtonColor: '#1db954'
                    });
                }
                return;
            }

            try {
                const result = await $.get(`/Playlists/ObtenerDetallePlaylist?id=${playlistId}`);
                if (!result || !result.esCorrecto || !result.data) {
                    return;
                }

                const songs = this.mapearSongsParaPlayer(result.data.songs || []);
                if (!songs.length || typeof window.Player === 'undefined') {
                    return;
                }

                window.Player.reproducir(songs[0], songs);
            } catch (error) {
                console.error(error);
            }
        },

        mapearSongsParaPlayer(songs) {
            return (songs || [])
                .map(s => ({
                    songId: s.songId ?? s.SongId,
                    title: s.title ?? s.Title ?? 'Sin titulo',
                    artistName: s.artistName ?? s.ArtistName ?? 'Artista desconocido',
                    coverImageUrl: this.normalizarRutaImagen((s.coverImageUrl ?? s.CoverImageUrl) || '/img/placeholder-cover.png'),
                    duration: s.durationSeconds ?? s.DurationSeconds ?? 0,
                    filePath: s.filePath ?? s.FilePath ?? ''
                }))
                .filter(s => Number(s.songId) > 0);
        },

        mostrarDiscovery() {
            $('#homePlaylistDetailContainer').addClass('d-none').empty();
            $('#homeDiscoveryContent').removeClass('d-none');
            $('.home-library-item').removeClass('is-active');
        },

        abrirModalAgregarCanciones(playlistId, playlistName) {
            const playlistSongs = $('#homePlaylistDetailContainer').data('playlist-songs') || [];
            const idsEnPlaylist = new Set(playlistSongs.map(s => Number(s.songId)).filter(Boolean));

            $('#modalAddSongsToPlaylistTitle').text(`Agregar canciones a "${playlistName}"`);
            $('#modalAddSongsToPlaylist').data('playlist-id', playlistId);
            $('#modalAddSongsToPlaylist').data('ids-en-playlist', idsEnPlaylist);
            $('#modalAddSongsSearch').val('');

            this.modalAddSongsAll = this.songs || [];
            this.renderizarListaModalAgregarCanciones(this.modalAddSongsAll, idsEnPlaylist);

            const modalEl = document.getElementById('modalAddSongsToPlaylist');
            if (modalEl) {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            }
        },

        renderizarListaModalAgregarCanciones(songs, idsEnPlaylist) {
            const list = $('#modalAddSongsList');
            list.empty();

            if (!songs || songs.length === 0) {
                list.append('<div class="text-secondary py-4 text-center">No hay canciones disponibles.</div>');
                return;
            }

            songs.forEach(song => {
                const songId = Number(song.songId);
                const yaAgregada = idsEnPlaylist && idsEnPlaylist.has(songId);
                const cover = song.coverImageUrl || song.albumCoverImageUrl || '/img/placeholder-album.avif';
                const artistName = song.artistName || 'Artista desconocido';

                const row = `
                    <div class="add-songs-modal-row ${yaAgregada ? 'added' : ''}" data-song-id="${songId}">
                        <img src="${cover}" alt="" class="add-songs-modal-cover" onerror="this.src='/img/placeholder-album.avif';" />
                        <div class="add-songs-modal-info">
                            <div class="add-songs-modal-title">${this.escapeHtml(song.title || 'Sin título')}</div>
                            <div class="add-songs-modal-artist">${this.escapeHtml(artistName)}</div>
                        </div>
                        <span class="add-songs-modal-duration">${this.formatearDuracion(song.duration)}</span>
                        <button type="button" class="add-songs-modal-add-btn" data-song-id="${songId}" ${yaAgregada ? 'disabled' : ''} title="${yaAgregada ? 'Ya en la playlist' : 'Agregar'}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `;
                list.append(row);
            });
        },

        filtrarModalAgregarCanciones(termino) {
            const all = this.modalAddSongsAll || [];
            const idsEnPlaylist = $('#modalAddSongsToPlaylist').data('ids-en-playlist') || new Set();

            if (!termino || termino.trim() === '') {
                this.renderizarListaModalAgregarCanciones(all, idsEnPlaylist);
                return;
            }

            const filtradas = all.filter(s => {
                const t = (s.title || '').toLowerCase();
                const a = (s.artistName || '').toLowerCase();
                const alb = (s.albumTitle || '').toLowerCase();
                return t.includes(termino) || a.includes(termino) || alb.includes(termino);
            });
            this.renderizarListaModalAgregarCanciones(filtradas, idsEnPlaylist);
        },

        async agregarCancionDesdeModal(playlistId, songId, btnElement) {
            const btn = $(btnElement);

            try {
                const body = new URLSearchParams({
                    playlistId: String(playlistId),
                    songId: String(songId)
                });

                const response = await fetch('/Playlists/AgregarCancionAPlaylist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    },
                    body
                });

                const result = await response.json();
                if (result && result.esCorrecto) {
                    const idsEnPlaylist = $('#modalAddSongsToPlaylist').data('ids-en-playlist') || new Set();
                    idsEnPlaylist.add(songId);
                    $('#modalAddSongsToPlaylist').data('ids-en-playlist', idsEnPlaylist);

                    btn.closest('.add-songs-modal-row').addClass('added');
                    btn.prop('disabled', true);
                    btn.find('i').removeClass('fa-plus').addClass('fa-check');

                    this.actualizarContadorPlaylistSidebar(playlistId);
                    document.dispatchEvent(new CustomEvent('playlist-song-added', {
                        detail: { playlistId, songId }
                    }));

                    if (Number(this.selectedPlaylistId) === Number(playlistId)) {
                        this.cargarDetallePlaylistEmbebido(playlistId);
                    }
                    return;
                }

                const mensaje = (result && result.mensaje) ? result.mensaje : 'No se pudo agregar la canción.';
                if (typeof Swal !== 'undefined') {
                    await Swal.fire({
                        title: 'No se pudo agregar',
                        text: mensaje,
                        icon: 'error',
                        background: '#232323',
                        color: '#f3f3f3',
                        confirmButtonColor: '#1db954'
                    });
                } else {
                    alert(mensaje);
                }
            } catch (error) {
                if (typeof Swal !== 'undefined') {
                    await Swal.fire({
                        title: 'Error de conexión',
                        text: 'No se pudo conectar con el servidor.',
                        icon: 'error',
                        background: '#232323',
                        color: '#f3f3f3',
                        confirmButtonColor: '#1db954'
                    });
                } else {
                    alert('No se pudo conectar con el servidor.');
                }
            }
        },

        renderizarDetallePlaylistEmbebido(playlist) {
            const detailContainer = $('#homePlaylistDetailContainer');
            const playlistId = Number(playlist.playlistId || 0);
            const usaPortadaSeleccionada = !!playlist.coverImageUrl && !playlist.coverImageUrl.includes('placeholder');
            const cover = this.normalizarRutaImagen(playlist.coverImageUrl || '/img/placeholder-cover.png');
            const collage = (playlist.headerCollageImages || []).slice(0, 4);
            const canciones = Array.isArray(playlist.songs) ? playlist.songs : [];

            const collageMarkup = collage.length > 0
                ? [0, 1, 2, 3].map(i => {
                    const src = this.normalizarRutaImagen(collage[i] || '/img/placeholder-cover.png');
                    return `<img src="${src}" class="playlist-collage-item" alt="thumbnail cancion ${i + 1}"
                              onerror="this.onerror=null; this.src='/img/placeholder-cover.png';" />`;
                }).join('')
                : `<div class="playlist-collage-empty"><i class="fas fa-music"></i></div>`;

            const cancionesMarkup = canciones.length === 0
                ? `<tr><td colspan="5" class="text-center text-secondary py-4">Esta playlist no tiene canciones todavia.</td></tr>`
                : canciones.map((cancion, index) => {
                    const songId = cancion.songId ?? cancion.SongId ?? 0;
                    const trackNumber = cancion.trackNumber ?? cancion.TrackNumber ?? (index + 1);
                    const title = cancion.title ?? cancion.Title ?? 'Sin titulo';
                    const artistName = cancion.artistName ?? cancion.ArtistName ?? 'Artista desconocido';
                    const albumTitle = cancion.albumTitle ?? cancion.AlbumTitle ?? 'Single';
                    const durationSeconds = cancion.durationSeconds ?? cancion.DurationSeconds ?? 0;
                    const coverImageUrl = this.normalizarRutaImagen((cancion.coverImageUrl ?? cancion.CoverImageUrl) || '/img/placeholder-cover.png');

                    return `
                        <tr class="playlist-song-row" data-song-index="${index}" data-song-id="${songId}">
                            <td class="text-secondary playlist-track-cell">
                                <span class="playlist-track-number">${trackNumber}</span>
                                <button type="button" class="playlist-track-play-btn" title="Reproducir ${this.escapeHtml(title)}">
                                    <i class="fas fa-play"></i>
                                </button>
                            </td>
                            <td>
                                <div class="playlist-song-title-cell">
                                    <img src="${coverImageUrl}"
                                         alt="${this.escapeHtml(title)}"
                                         class="playlist-song-cover"
                                         onerror="this.onerror=null; this.src='/img/placeholder-cover.png';" />
                                    <div class="playlist-song-text">
                                        <span class="playlist-song-title">${this.escapeHtml(title)}</span>
                                        <span class="playlist-song-artist">${this.escapeHtml(artistName)}</span>
                                    </div>
                                </div>
                            </td>
                            <td class="text-secondary">${this.escapeHtml(albumTitle)}</td>
                            <td class="text-end text-secondary">${this.formatearDuracion(durationSeconds)}</td>
                            <td class="playlist-row-actions text-end">
                                <button type="button" class="playlist-more-btn" title="Mas opciones" aria-label="Mas opciones" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="fas fa-ellipsis-h"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end playlist-song-dropdown">
                                    <li>
                                        <button type="button"
                                                class="dropdown-item playlist-remove-song-option"
                                                data-playlist-id="${playlistId}"
                                                data-song-id="${songId}">
                                            <i class="fas fa-trash me-2"></i>Eliminar de esta playlist
                                        </button>
                                    </li>
                                </ul>
                            </td>
                        </tr>
                    `;
                }).join('');

            detailContainer.html(`
                <div class="playlist-detail-page home-embedded-detail">
                    <div class="playlist-detail-header">
                        <button type="button" class="playlist-detail-cover is-editable js-playlist-cover-edit" data-playlist-id="${playlistId}" title="Editar playlist" aria-label="Editar playlist">
                            ${usaPortadaSeleccionada
                                ? `<img src="${cover}" alt="${this.escapeHtml(playlist.name)}" class="playlist-detail-cover-image"
                                       onerror="this.onerror=null; this.src='/img/placeholder-cover.png';" />`
                                : `<div class="playlist-collage">${collageMarkup}</div>`}
                            <span class="playlist-cover-edit-overlay">
                                <i class="fas fa-pen"></i>
                            </span>
                        </button>

                        <div class="playlist-detail-info">
                            <p class="playlist-detail-type mb-1">Playlist publica</p>
                            <h1 class="playlist-detail-title">${this.escapeHtml(playlist.name)}</h1>
                            <p class="playlist-detail-meta mb-0">
                                <span>${this.escapeHtml(playlist.username || 'Usuario')}</span>
                                <span class="mx-2">-</span>
                                <span>${playlist.songCount || 0} canciones</span>
                                <span class="mx-2">-</span>
                                <span>${this.formatearDuracionTotal(playlist.totalDurationSeconds || 0)}</span>
                            </p>
                        </div>
                    </div>

                    <div class="playlist-detail-body">
                        <div class="playlist-detail-toolbar d-flex justify-content-between align-items-center">
                            <button type="button" class="btn-playlist-back" id="btnVolverHomeDiscovery">
                                <i class="fas fa-arrow-left me-2"></i>Volver
                            </button>
                            <button type="button" class="btn-spotify btn-sm js-add-songs-to-playlist" data-playlist-id="${playlistId}" data-playlist-name="${this.escapeHtml(playlist.name)}">
                                <i class="fas fa-plus me-2"></i>Agregar canciones
                            </button>
                        </div>

                        <div class="playlist-songs-table-wrapper">
                            <table class="table playlist-songs-table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th style="width: 50px;">#</th>
                                        <th>Titulo</th>
                                        <th>Album</th>
                                        <th class="text-end" style="width: 90px;"><i class="far fa-clock"></i></th>
                                        <th style="width: 44px;"></th>
                                    </tr>
                                </thead>
                                <tbody>${cancionesMarkup}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `);

            detailContainer.data('playlist-songs', canciones.map(c => ({
                songId: c.songId ?? c.SongId,
                title: c.title ?? c.Title,
                artistName: c.artistName ?? c.ArtistName,
                coverImageUrl: this.normalizarRutaImagen((c.coverImageUrl ?? c.CoverImageUrl) || '/img/placeholder-cover.png'),
                duration: c.durationSeconds ?? c.DurationSeconds,
                filePath: c.filePath ?? c.FilePath ?? ''
            })).filter(s => Number(s.songId) > 0));

            $('#homeDiscoveryContent').addClass('d-none');
            detailContainer.removeClass('d-none');
            this.aplicarDegradadoHeaderPlaylist(detailContainer[0]);
        },

        async aplicarDegradadoHeaderPlaylist(containerElement) {
            if (!containerElement) return;
            const header = containerElement.querySelector('.playlist-detail-header');
            if (!header) return;

            const sourceImage = header.querySelector('.playlist-detail-cover-image')
                || header.querySelector('.playlist-collage-item');
            const src = sourceImage ? sourceImage.getAttribute('src') : null;
            if (!src) return;

            try {
                const color = await this.obtenerColorDominante(src);
                if (!color) return;
                const dark = {
                    r: Math.max(0, Math.round(color.r * 0.45)),
                    g: Math.max(0, Math.round(color.g * 0.45)),
                    b: Math.max(0, Math.round(color.b * 0.45))
                };
                header.style.background = `linear-gradient(180deg, rgba(${color.r}, ${color.g}, ${color.b}, 0.88) 0%, rgba(${dark.r}, ${dark.g}, ${dark.b}, 0.75) 55%, rgba(18, 18, 18, 0.92) 100%)`;
            } catch (error) {
                // Fallback silencioso al degradado CSS por defecto.
            }
        },

        obtenerColorDominante(src) {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            resolve(null);
                            return;
                        }

                        const sampleSize = 24;
                        canvas.width = sampleSize;
                        canvas.height = sampleSize;
                        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
                        const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

                        let r = 0, g = 0, b = 0, count = 0;
                        for (let i = 0; i < data.length; i += 4) {
                            const alpha = data[i + 3];
                            if (alpha < 80) continue;
                            r += data[i];
                            g += data[i + 1];
                            b += data[i + 2];
                            count++;
                        }

                        if (!count) {
                            resolve(null);
                            return;
                        }

                        resolve({
                            r: Math.round(r / count),
                            g: Math.round(g / count),
                            b: Math.round(b / count)
                        });
                    } catch {
                        resolve(null);
                    }
                };
                img.onerror = () => resolve(null);
                img.src = src;
            });
        },

        async eliminarCancionDePlaylistEmbebida(playlistId, songId) {
            if (typeof Swal !== 'undefined') {
                const confirmacion = await Swal.fire({
                    title: 'Eliminar cancion',
                    text: 'Se quitara esta cancion de la playlist.',
                    icon: undefined,
                    background: '#232323',
                    color: '#f3f3f3',
                    showCancelButton: true,
                    reverseButtons: true,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'playlist-swal-popup',
                        confirmButton: 'playlist-swal-confirm',
                        cancelButton: 'playlist-swal-cancel'
                    },
                    confirmButtonText: 'Si, eliminar',
                    cancelButtonText: 'Cancelar'
                });

                if (!confirmacion.isConfirmed) {
                    return;
                }
            }

            const body = new URLSearchParams({
                playlistId: String(playlistId),
                songId: String(songId)
            });

            try {
                const response = await fetch('/Playlists/EliminarCancionDePlaylist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    },
                    body
                });

                const result = await response.json();
                if (result && result.esCorrecto) {
                    this.recargarSidebarYDetalle(playlistId);
                    return;
                }

                const mensaje = (result && result.mensaje) ? result.mensaje : 'No se pudo eliminar la canción.';
                if (typeof Swal !== 'undefined') {
                    await Swal.fire({
                        title: 'No se pudo eliminar',
                        text: mensaje,
                        icon: 'error',
                        background: '#232323',
                        color: '#f3f3f3',
                        confirmButtonColor: '#1db954'
                    });
                } else {
                    alert(mensaje);
                }
            } catch (error) {
                if (typeof Swal !== 'undefined') {
                    await Swal.fire({
                        title: 'Error de conexion',
                        text: 'No se pudo conectar con el servidor.',
                        icon: 'error',
                        background: '#232323',
                        color: '#f3f3f3',
                        confirmButtonColor: '#1db954'
                    });
                } else {
                    alert('No se pudo conectar con el servidor.');
                }
            }
        },

        aplicarFiltroCanciones(termino) {
            const texto = (termino || '').toLowerCase();
            this.filteredSongs = this.songs.filter(s => {
                const t = (s.title || '').toLowerCase();
                const a = (s.artistName || '').toLowerCase();
                const alb = (s.albumTitle || '').toLowerCase();
                return t.includes(texto) || a.includes(texto) || alb.includes(texto);
            });
            this.currentPage = 1;
            this.renderSongsPage();

            const filtradosArtists = this.artists.filter(a =>
                (a.name || '').toLowerCase().includes(texto)
            );
            this.pintarArtists(filtradosArtists);

            const filtradosAlbums = this.albums.filter(alb => {
                const title = (alb.title || '').toLowerCase();
                const artist = (alb.artistName || '').toLowerCase();
                return title.includes(texto) || artist.includes(texto);
            });
            this.pintarAlbums(filtradosAlbums);
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

        pintarSongs(songs) {
            const grid = $('#songsGrid');
            grid.empty();

            if (!songs || songs.length === 0) {
                grid.append('<div class="text-secondary">No hay canciones disponibles</div>');
                return;
            }

            songs.forEach(song => {
                const cover = song.coverImageUrl || song.albumCoverImageUrl || '/img/placeholder-album.avif';
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
                            <img src="${cover}" alt="${song.title}" onerror="this.src='/img/placeholder-album.avif';" />
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
                if (album.artistName && album.artistName.length > 0) {
                    return album;
                }

                const artist = this.artists.find(a => a.artistId === album.artistId);
                return {
                    ...album,
                    artistName: artist ? artist.name : (album.artistName || '')
                };
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

        normalizarRutaImagen(url) {
            if (!url) {
                return '/img/placeholder-cover.png';
            }
            if (/^https?:\/\//i.test(url)) {
                return url;
            }
            const normalizada = String(url).replace(/\\/g, '/').trim();
            return normalizada.startsWith('/') ? normalizada : `/${normalizada}`;
        },

        tienePortadaPersonalizada(url) {
            if (!url) {
                return false;
            }
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

            // Filtrar álbumes del artista (por ArtistId en albums)
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

            // Intentar obtener nombre de artista desde albums o desde artists
            let artistName = album.artistName || '';
            if (!artistName && album.artistId) {
                const artist = this.artists.find(a => a.artistId == album.artistId);
                if (artist) {
                    artistName = artist.name;
                }
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
    };

    $(document).ready(() => Home.init());
})();