(() => {
    const Home = window.Home || (window.Home = {});

    Object.assign(Home, {
        cargarSongs() {
            return $.get('/Music/ObtenerSongs', result => {
                if (result.esCorrecto) {
                    this.songs = result.data || [];
                    this.filteredSongs = [...this.songs];
                    this.currentDisplayedSongs = [...this.filteredSongs];
                }
            });
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
        }
    });
})();
