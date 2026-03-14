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

        init() {
            this.audio = document.getElementById('mainAudio');
            if (!this.audio) return;

            this.registrarEventos();
            this.restaurarEstado();
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
                isRepeat: this.isRepeat
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
            const fp = (song.filePath || '').trim();
            if (fp.startsWith('http://') || fp.startsWith('https://')) return fp;
            if (fp.startsWith('/') && !fp.startsWith('//')) return fp;
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

            $('#playerProgressBar').on('click', function(e) {
                const bar = $(this);
                const frac = (e.offsetX / bar.outerWidth()) || 0;
                self.seek(frac);
            });
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

        actualizarUI(song) {
            const title = song.title || 'Sin título';
            const artist = song.artistName || 'Artista desconocido';
            const cover = song.coverImageUrl || song.albumCoverImageUrl;

            $('#playerSongTitle').text(title);
            $('#playerSongArtist').text(artist);

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
