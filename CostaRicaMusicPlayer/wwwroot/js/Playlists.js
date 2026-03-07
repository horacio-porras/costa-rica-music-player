(() => {
    const Playlists = {
        playlists: [],

        init() {
            this.cargarPlaylists();
            this.registrarEventos();
        },

        registrarEventos() {
            $('#btnGuardarPlaylist').on('click', (e) => {
                e.preventDefault();
                this.guardarPlaylist();
            });

            $('#btnEditarPlaylist').on('click', (e) => {
                e.preventDefault();
                this.editarPlaylist();
            });

            // Delegación de eventos para botones de acción
            $(document).on('click', '.playlist-card .btn-ver', function () {
                const id = $(this).closest('.playlist-card').data('playlist-id');
                Playlists.verPlaylist(id);
            });

            $(document).on('click', '.playlist-card .btn-editar', function () {
                const id = $(this).closest('.playlist-card').data('playlist-id');
                Playlists.cargarPlaylist(id);
            });

            $(document).on('click', '.playlist-card .btn-eliminar', function () {
                const id = $(this).closest('.playlist-card').data('playlist-id');
                Playlists.eliminarPlaylist(id);
            });

            // Limpiar modal al cerrar
            $('#modalCrearPlaylist').on('hidden.bs.modal', function () {
                $('#formCrearPlaylist')[0].reset();
            });

            $('#modalEditarPlaylist').on('hidden.bs.modal', function () {
                $('#formEditarPlaylist')[0].reset();
            });
        },

        cargarPlaylists() {
            $.get('/Playlists/ObtenerPlaylists', result => {
                if (result.esCorrecto) {
                    this.playlists = result.data || [];
                    this.pintarPlaylists(this.playlists);
                }
            });
        },

        pintarPlaylists(playlists) {
            const grid = $('#playlistsGrid');
            grid.empty();

            if (!playlists || playlists.length === 0) {
                grid.append(`
                    <div class="empty-state text-center py-5">
                        <i class="fas fa-music fa-4x text-secondary mb-3"></i>
                        <h3 class="h5 text-white">No hay playlists</h3>
                        <p class="text-secondary small">Crea tu primera playlist para comenzar</p>
                        <button class="btn-spotify mt-2" data-bs-toggle="modal" data-bs-target="#modalCrearPlaylist">
                            <i class="fas fa-plus-circle me-2"></i>Crear playlist
                        </button>
                    </div>
                `);
                return;
            }

            playlists.forEach(p => {
                // Determinar la imagen a mostrar
                let coverImage = p.coverImageUrl || '/img/placeholder-album.avif';

                const card = `
                    <div class="playlist-card" data-playlist-id="${p.playlistId}">
                        <div class="playlist-card-cover">
                            <img src="${coverImage}" 
                                 alt="${p.name}" 
                                 class="playlist-cover-img"
                                 onerror="this.onerror=null; this.src='/img/placeholder-album.avif';" />
                            <div class="playlist-actions">
                                <button class="playlist-action-btn btn-ver" title="Ver playlist">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="playlist-action-btn btn-editar" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="playlist-action-btn btn-eliminar" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="playlist-card-body">
                            <div class="playlist-card-title" title="${p.name}">${p.name}</div>
                            <div class="playlist-card-subtitle">
                                <i class="fas fa-user me-1"></i>Usuario ${p.userId || 'desconocido'}
                            </div>
                            <div class="playlist-card-meta">
                                <i class="fas fa-music me-1"></i>${p.songCount || 0} canciones
                            </div>
                        </div>
                    </div>`;
                grid.append(card);
            });
        },

        guardarPlaylist() {
            const form = $('#formCrearPlaylist');

            if (!form.valid || (form.valid && !form.valid())) {
                return;
            }

            $.ajax({
                url: form.attr('action'),
                type: 'POST',
                data: form.serialize(),
                success: (response) => {
                    if (response.esCorrecto) {
                        $('#modalCrearPlaylist').modal('hide');
                        this.cargarPlaylists();
                        this.mostrarNotificacion('Playlist creada exitosamente');
                    } else {
                        alert(response.mensaje || 'Error al crear la playlist');
                    }
                },
                error: () => {
                    alert('Error de conexión al servidor');
                }
            });
        },

        // Actualizar el método cargarPlaylist
        cargarPlaylist(id) {
            $.get(`/Playlists/ObtenerPlaylistPorId?id=${id}`, result => {
                if (result.esCorrecto && result.data) {
                    const data = result.data;

                    // Llamar a la función global para cargar datos en el modal
                    if (typeof cargarPlaylistEnModal === 'function') {
                        cargarPlaylistEnModal(data);
                    } else {
                        // Fallback si la función no existe
                        $('#PlaylistId').val(data.playlistId);
                        $('#EditPlaylistName').val(data.name);
                        $('#EditUserId').val(data.userId);
                        $('#EditCoverImageUrl').val(data.coverImageUrl);
                        $('#previewImagenActual').attr('src', data.coverImageUrl || '/img/placeholder-playlist.jpg');
                    }

                    $('#modalEditarPlaylist').modal('show');
                } else {
                    alert('No se pudo cargar la playlist');
                }
            }).fail(() => {
                alert('Error al cargar la playlist');
            });
        },

        editarPlaylist() {
            const form = $('#formEditarPlaylist');

            if (!form.valid || (form.valid && !form.valid())) {
                return;
            }

            $.ajax({
                url: form.attr('action'),
                type: 'POST',
                data: form.serialize(),
                success: (response) => {
                    if (response.esCorrecto) {
                        $('#modalEditarPlaylist').modal('hide');
                        this.cargarPlaylists();
                        this.mostrarNotificacion('Playlist actualizada exitosamente');
                    } else {
                        alert(response.mensaje || 'Error al actualizar la playlist');
                    }
                },
                error: () => {
                    alert('Error de conexión al servidor');
                }
            });
        },

        verPlaylist(id) {
            window.location.href = `/Playlists/Detalle/${id}`;
        },

        eliminarPlaylist(id) {
            if (!confirm('¿Estás seguro de eliminar esta playlist? Esta acción no se puede deshacer.')) {
                return;
            }

            $.ajax({
                url: '/Playlists/EliminarPlaylist',
                type: 'POST',
                data: { id },
                success: (response) => {
                    if (response.esCorrecto) {
                        this.cargarPlaylists();
                        this.mostrarNotificacion('Playlist eliminada correctamente');
                    } else {
                        alert(response.mensaje || 'Error al eliminar la playlist');
                    }
                },
                error: () => {
                    alert('Error de conexión al servidor');
                }
            });
        },

        mostrarNotificacion(mensaje) {
            // Por ahora solo un console.log, luego puedes implementar toastr o similar
            console.log(mensaje);
        }
    };

    $(document).ready(() => Playlists.init());
})();