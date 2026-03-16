/**
 * Reproductor global - controla la barra inferior y reproduce canciones.
 * Persiste entre navegaciones (Home, Music, Playlists, etc.) usando sessionStorage.
 */
(() => {
    const STORAGE_KEY = 'crmp_player_state';

    const Player = {
        audio: null,
        playlist: [],
        currentIndex: -1,
        isShuffle: false,
        isRepeat: false,
        volume: 0.8,

        init() {
            this.audio = document.getElementById('mainAudio');
            if (!this.audio) return;
            this.audio.volume = this.volume;

            this.registrarEventos();
            this.restaurarEstado();
            this.actualizarUIVolumen();
            window.addEventListener('beforeunload', () => this.guardarEstado());
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this.guardarEstado();
            });
        },

        guardarEstado() {
            if (!this.audio?.src || this.playlist.length === 0) return;
            const song = this.playlist[this.currentIndex];
            if (!song) return;
            const state = {
                song,
                currentTime: this.audio.currentTime,
                isPlaying: !this.audio.paused,
                playlist: this.playlist,
                currentIndex: this.currentIndex,
                isShuffle: this.isShuffle,
                isRepeat: this.isRepeat,
                volume: this.audio.volume
            };
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) {}
        },

        restaurarEstado() {
            try {
                const raw = sessionStorage.getItem(STORAGE_KEY);
                if (!raw) return;
                const state = JSON.parse(raw);
                if (!state?.song) return;

                this.playlist = state.playlist || [state.song];
                this.currentIndex = Math.min(state.currentIndex ?? 0, Math.max(0, this.playlist.length - 1));
                this.isShuffle = !!state.isShuffle;
                this.isRepeat = !!state.isRepeat;
                this.volume = (typeof state.volume === 'number')
                    ? Math.min(1, Math.max(0, state.volume))
                    : this.volume;
                this.audio.volume = this.volume;
                this.actualizarUIVolumen();

                const s = state.song;
                const seekTo = Math.max(0, state.currentTime || 0);

                this.actualizarUI(s);
                const url = this.obtenerUrlAudio(s);
                this.audio.src = url;

                const onCanPlay = () => {
                    this.audio.currentTime = Math.min(seekTo, this.audio.duration || 0);
                    this.audio.removeEventListener('canplay', onCanPlay);
                    this.actualizarProgreso();
                    if (state.isPlaying) {
                        this.audio.play().catch(() => {});
                        this.actualizarIconoPlayPause(true);
                    } else {
                        this.actualizarIconoPlayPause(false);
                    }
                };
                this.audio.addEventListener('canplay', onCanPlay);
                this.audio.load();

                $('#btnShuffle').toggleClass('text-white', this.isShuffle).toggleClass('text-secondary', !this.isShuffle);
                $('#btnRepeat').toggleClass('text-white', this.isRepeat).toggleClass('text-secondary', !this.isRepeat);
            } catch (e) {}
        },

        obtenerUrlAudio(song) {
            const rawPath = (song.filePath || '').trim();
            const fp = rawPath.replace(/\\/g, '/');
            if (fp.startsWith('http://') || fp.startsWith('https://')) return fp;
            if (fp.startsWith('/') && !fp.startsWith('//')) return fp;
            if (fp.length > 0) return `/${fp.replace(/^\/+/, '')}`;
            return `/Music/StreamSong/${song.songId}`;
        },

        registrarEventos() {
            const self = this;

            this.audio.addEventListener('ended', () => self.onEnded());
            this.audio.addEventListener('timeupdate', () => self.onTimeUpdate());
            this.audio.addEventListener('loadedmetadata', () => self.onLoadedMetadata());
            this.audio.addEventListener('error', () => self.onError());

            $('#btnPlayPause').on('click', () => self.togglePlayPause());
            $('#btnPrev').on('click', () => self.prev());
            $('#btnNext').on('click', () => self.next());
            $('#btnShuffle').on('click', () => self.toggleShuffle());
            $('#btnRepeat').on('click', () => self.toggleRepeat());
            $('#btnRestart').on('click', () => self.restart());
            $('#btnAddSongToPlaylist').on('click', async () => {
                await self.agregarCancionAPlaylistActual();
            });
            $('#playerVolumeRange').on('input change', function () {
                const raw = Number($(this).val());
                const value = Number.isNaN(raw) ? 80 : raw;
                self.audio.volume = Math.min(1, Math.max(0, value / 100));
                self.volume = self.audio.volume;
                self.actualizarUIVolumen();
                self.guardarEstado();
            });

            $('#playerProgressBar').on('click', function(e) {
                const bar = $(this);
                const frac = (e.offsetX / bar.outerWidth()) || 0;
                self.seek(frac);
            });
        },

        actualizarUIVolumen() {
            const slider = document.getElementById('playerVolumeRange');
            if (slider) {
                const value = Math.round((this.audio?.volume ?? this.volume) * 100);
                slider.value = String(value);
                // Misma lógica visual que la barra de progreso: base gris + tramo verde.
                slider.style.background = `linear-gradient(to right, #1db954 0%, #1db954 ${value}%, #555 ${value}%, #555 100%)`;
            }
        },

        /**
         * Reproduce una canción. song debe tener: songId, title, artistName, coverImageUrl/albumCoverImageUrl, filePath
         * playlist opcional: array de canciones para anterior/siguiente
         */
        reproducir(song, playlist = []) {
            if (!song) return;

            this.playlist = playlist.length > 0 ? playlist : (song ? [song] : []);
            this.currentIndex = this.playlist.findIndex(s => s.songId === song.songId);
            if (this.currentIndex < 0) this.currentIndex = 0;

            const url = this.obtenerUrlAudio(song);
            this.audio.src = url;
            this.audio.load();
            this.actualizarUI(song);
            this.audio.play().catch(() => {});

            this.actualizarIconoPlayPause(true);
            this.actualizarProgreso();
            this.guardarEstado();
        },

        obtenerCancionActual() {
            if (!Array.isArray(this.playlist) || this.playlist.length === 0 || this.currentIndex < 0) {
                return null;
            }
            return this.playlist[this.currentIndex] || null;
        },

        async agregarCancionAPlaylistActual() {
            const song = this.obtenerCancionActual();
            if (!song || !song.songId) {
                this.mostrarMensaje('No hay canción seleccionada.', 'warning');
                return;
            }

            let playlistsResponse = null;
            try {
                playlistsResponse = await $.get('/Playlists/ObtenerPlaylists');
            } catch (xhr) {
                if (xhr && xhr.status === 401) {
                    this.mostrarMensaje('Inicia sesión para guardar canciones en tus playlists.', 'info');
                    return;
                }
                this.mostrarMensaje('No se pudieron cargar tus playlists.', 'error');
                return;
            }

            if (!playlistsResponse || playlistsResponse.codigoStatus === 401) {
                this.mostrarMensaje('Inicia sesión para guardar canciones en tus playlists.', 'info');
                return;
            }

            const playlists = playlistsResponse.data || [];
            if (playlists.length === 0) {
                this.mostrarMensaje('Primero crea una playlist para poder agregar canciones.', 'info');
                return;
            }

            const playlistId = await this.solicitarPlaylistDestino(playlists);
            if (!playlistId) {
                return;
            }

            try {
                const body = new URLSearchParams({
                    playlistId: String(playlistId),
                    songId: String(song.songId)
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
                    this.mostrarMensaje('Canción agregada a la playlist.', 'success');
                    document.dispatchEvent(new CustomEvent('playlist-song-added', {
                        detail: { playlistId: Number(playlistId), songId: Number(song.songId) }
                    }));
                    return;
                }

                const mensaje = (result && result.mensaje) ? result.mensaje : 'No se pudo agregar la canción.';
                this.mostrarMensaje(mensaje, result && result.codigoStatus === 409 ? 'info' : 'error');
            } catch (e) {
                this.mostrarMensaje('No se pudo agregar la canción por un error de red.', 'error');
            }
        },

        async solicitarPlaylistDestino(playlists) {
            if (typeof Swal !== 'undefined') {
                const options = {};
                playlists.forEach((p) => {
                    const cantidad = Number(p.songCount || 0);
                    options[String(p.playlistId)] = `${p.name} (${cantidad})`;
                });

                const result = await Swal.fire({
                    title: 'Agregar a playlist',
                    input: 'select',
                    inputOptions: options,
                    inputPlaceholder: 'Selecciona una playlist',
                    showCancelButton: true,
                    reverseButtons: true,
                    buttonsStyling: false,
                    customClass: {
                        popup: 'playlist-swal-popup',
                        confirmButton: 'playlist-swal-confirm',
                        cancelButton: 'playlist-swal-cancel',
                        input: 'playlist-swal-select'
                    },
                    confirmButtonText: 'Agregar',
                    cancelButtonText: 'Cancelar',
                    background: '#232323',
                    color: '#f3f3f3',
                    inputValidator: (value) => {
                        if (!value) return 'Selecciona una playlist';
                        return null;
                    }
                });

                if (!result.isConfirmed || !result.value) {
                    return null;
                }
                return Number(result.value);
            }

            const listado = playlists
                .map((p, index) => `${index + 1}. ${p.name}`)
                .join('\n');
            const entrada = prompt(`Selecciona el número de la playlist:\n\n${listado}`);
            const indice = Number(entrada) - 1;
            if (Number.isNaN(indice) || indice < 0 || indice >= playlists.length) {
                return null;
            }
            return playlists[indice].playlistId;
        },

        mostrarMensaje(texto, tipo = 'info') {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: texto,
                    icon: tipo,
                    background: '#232323',
                    color: '#f3f3f3',
                    timer: tipo === 'success' ? 1300 : undefined,
                    showConfirmButton: tipo !== 'success',
                    confirmButtonColor: '#1db954'
                });
                return;
            }
            alert(texto);
        },

        actualizarUI(song) {
            const title = song.title || 'Sin título';
            const artist = song.artistName || 'Artista desconocido';
            const cover = song.coverImageUrl || song.albumCoverImageUrl;

            $('#playerSongTitle').text(title);
            $('#playerSongArtist').text(artist);
            const addBtn = document.getElementById('btnAddSongToPlaylist');
            if (addBtn) {
                addBtn.disabled = !song.songId;
            }

            const img = document.getElementById('playerCoverImg');
            const icon = document.getElementById('playerPlaceholderIcon');
            if (cover) {
                img.src = cover;
                img.style.display = 'block';
                icon.style.display = 'none';
                img.onerror = () => {
                    img.style.display = 'none';
                    icon.style.display = 'inline';
                };
            } else {
                img.style.display = 'none';
                icon.style.display = 'inline';
                img.src = '';
            }
        },

        actualizarIconoPlayPause(playing) {
            const btn = document.getElementById('btnPlayPause');
            if (!btn) return;
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = playing ? 'fas fa-pause-circle fa-3x' : 'fas fa-play-circle fa-3x';
            }
        },

        togglePlayPause() {
            if (!this.audio.src) return;
            if (this.audio.paused) {
                this.audio.play().catch(() => {});
                this.actualizarIconoPlayPause(true);
            } else {
                this.audio.pause();
                this.actualizarIconoPlayPause(false);
            }
            this.guardarEstado();
        },

        prev() {
            if (this.audio.currentTime > 3 && this.playlist.length > 0) {
                this.restart();
                return;
            }
            if (this.playlist.length === 0) return;
            let idx = this.currentIndex - 1;
            if (idx < 0) idx = this.playlist.length - 1;
            this.currentIndex = idx;
            this.reproducir(this.playlist[idx], this.playlist);
        },

        restart() {
            if (!this.audio.src) return;
            this.audio.currentTime = 0;
            this.actualizarProgreso();
            if (!this.audio.paused) this.audio.play().catch(() => {});
            this.guardarEstado();
        },

        seek(frac) {
            if (!this.audio.src || !isFinite(this.audio.duration)) return;
            this.audio.currentTime = Math.max(0, Math.min(1, frac)) * this.audio.duration;
            this.actualizarProgreso();
            this.guardarEstado();
        },

        next() {
            if (this.playlist.length === 0) return;
            let idx = this.currentIndex + 1;
            if (idx >= this.playlist.length) idx = 0;
            this.currentIndex = idx;
            this.reproducir(this.playlist[idx], this.playlist);
        },

        toggleShuffle() {
            this.isShuffle = !this.isShuffle;
            $('#btnShuffle').toggleClass('text-white', this.isShuffle).toggleClass('text-secondary', !this.isShuffle);
        },

        toggleRepeat() {
            this.isRepeat = !this.isRepeat;
            $('#btnRepeat').toggleClass('text-white', this.isRepeat).toggleClass('text-secondary', !this.isRepeat);
        },

        onEnded() {
            if (this.playlist.length === 0) {
                this.actualizarIconoPlayPause(false);
                return;
            }
            if (this.isRepeat) {
                this.audio.currentTime = 0;
                this.audio.play().catch(() => {});
            } else {
                this.next();
            }
        },

        formatearTiempo(segundos) {
            if (!segundos || !isFinite(segundos)) return '0:00';
            const m = Math.floor(segundos / 60);
            const s = Math.floor(segundos % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        },

        actualizarProgreso() {
            const t = this.audio?.currentTime ?? 0;
            const d = this.audio?.duration;
            const el = id => document.getElementById(id);
            if (!el('playerTimeCurrent')) return;
            if (!isFinite(d) || d <= 0) {
                el('playerTimeCurrent').textContent = '0:00';
                if (el('playerTimeTotal')) el('playerTimeTotal').textContent = '0:00';
                if (el('playerProgressFill')) el('playerProgressFill').style.width = '0%';
                return;
            }
            el('playerTimeCurrent').textContent = this.formatearTiempo(t);
            if (el('playerTimeTotal')) el('playerTimeTotal').textContent = this.formatearTiempo(d);
            const fill = el('playerProgressFill');
            if (fill) fill.style.width = ((t / d) * 100) + '%';
        },

        _lastSaveTime: 0,
        onTimeUpdate() {
            this.actualizarProgreso();
            if (!this.audio?.src || this.playlist.length === 0) return;
            const now = Date.now();
            if (now - this._lastSaveTime < 2000) return;
            this._lastSaveTime = now;
            this.guardarEstado();
        },
        onLoadedMetadata() {
            this.actualizarProgreso();
        },
        onError() {
            this.actualizarIconoPlayPause(false);
        }
    };

    window.Player = Player;
    $(document).ready(() => Player.init());
})();
