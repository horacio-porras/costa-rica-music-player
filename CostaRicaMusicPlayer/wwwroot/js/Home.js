(() => {
    const Home = {
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
        recommendedSongs: [],
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

            // Reproducir canción al hacer clic en la card (excepto en artista/álbum)
            $(document).on('click', '#recommendedSongsGrid .music-card', function(e) {
                if ($(e.target).closest('.music-card-artist, .music-card-album').length) return;
                const card = $(this);
                const songId = card.data('song-id');
                if (songId && window.Player) {
                    const song = self.recommendedSongs.find(s => s.songId == songId);
                    if (song) window.Player.reproducir(song, self.recommendedSongs);
                }
            });

            // Delegación de eventos para álbumes (en cards y en listas)
            $(document).on('click', '.music-card-album, .artist-album-item', (e) => {
                const el = $(e.currentTarget);
                const albumId = el.data('album-id');
                if (!albumId) return;
                self.mostrarAlbum(albumId);
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
        },

        cargarDatos() {
            // Cargar todos los datos necesarios
            Promise.all([
                this.cargarSongs(),
                this.cargarArtists(),
                this.cargarAlbums(),
                this.cargarPlaylists()
            ]).then(() => {
                // Una vez cargados todos, mostrar los elementos aleatorios
                this.mostrarCancionesRecomendadas();
                this.mostrarArtistasRecomendados();
                this.mostrarSidebarPlaylists();
            });
        },

        cargarSongs() {
            return $.get('/Music/ObtenerSongs', result => {
                if (result.esCorrecto) {
                    this.songs = result.data || [];
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
                        <div class="playlist-detail-cover">
                            ${usaPortadaSeleccionada
                                ? `<img src="${cover}" alt="${this.escapeHtml(playlist.name)}" class="playlist-detail-cover-image"
                                       onerror="this.onerror=null; this.src='/img/placeholder-cover.png';" />`
                                : `<div class="playlist-collage">${collageMarkup}</div>`}
                        </div>

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
                        <div class="playlist-detail-toolbar">
                            <button type="button" class="btn-playlist-back" id="btnVolverHomeDiscovery">
                                <i class="fas fa-arrow-left me-2"></i>Volver
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

        mostrarCancionesRecomendadas() {
            const grid = $('#recommendedSongsGrid');
            grid.empty();

            this.recommendedSongs = this.obtenerElementosAleatorios(this.songs, 8);

            if (this.recommendedSongs.length === 0) {
                grid.append('<div class="text-secondary">No hay canciones disponibles</div>');
                return;
            }

            this.recommendedSongs.forEach(song => {
                const cover = song.coverImageUrl || song.albumCoverImageUrl || '/img/placeholder-album.avif';
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

    $(document).ready(() => Home.init());
})();