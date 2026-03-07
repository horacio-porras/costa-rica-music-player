(() => {
    const Music = {
        songs: [],
        artists: [],

        init() {
            this.cargarSongs();
            this.cargarArtists();
            this.registrarEventos();
        },

        registrarEventos() {
            const self = this;
            $('#txtBuscarCancion').on('input', () => {
                const termino = $('#txtBuscarCancion').val().toLowerCase();
                self.filtrar(termino);
            });


            $(document).on('click', '.artist-card, .artist-name', (e) => {
                const el = $(e.currentTarget);
                const artistId = el.data('artist-id') || el.closest('.artist-card').data('artist-id');

                if (!artistId) return;

                self.mostrarArtist(artistId);
            });
        },

        cargarSongs() {
            $.get('/Music/ObtenerSongs', result => {
                if (result.esCorrecto) {
                    this.songs = result.data || [];
                    this.pintarSongs(this.songs);
                }
            });
        },

        cargarArtists() {
            $.get('/Music/ObtenerArtists', result => {
                if (result.esCorrecto) {
                    this.artists = result.data || [];
                    this.pintarArtists(this.artists);
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

                const card = `
                    <div class="music-card">
                        <div class="music-card-cover">
                            <img src="${cover}" alt="${albumTitle}" onerror="this.src='/img/placeholder-album.avif';" />
                        </div>
                        <div class="music-card-body">
                            <div class="music-card-title" title="${song.title}">${song.title}</div>
                            <div class="music-card-subtitle">
                                <span class="music-card-artist" data-artist-id="${song.artistId || ''}" title="${artistName}">${artistName}</span>
                                <span class="music-card-dot">•</span>
                                <span class="music-card-album" title="${albumTitle}">${albumTitle}</span>
                            </div>
                        </div>
                        <div class="music-card-duration">
                            ${this.formatearDuracion(song.duration)}
                        </div>
                    </div>`;
                grid.append(card);
            });
        },

        filtrar(termino) {
            const filtradasSongs = this.songs.filter(s => {
                const t = (s.title || '').toLowerCase();
                const a = (s.artistName || '').toLowerCase();
                return t.includes(termino) || a.includes(termino);
            });
            this.pintarSongs(filtradasSongs);

            const filtradosArtists = this.artists.filter(a =>
                a.name && a.name.toLowerCase().includes(termino)
            );
            this.pintarArtists(filtradosArtists);
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

            const list = $('#artistSongsList');
            list.empty();

            if (songs.length === 0) {
                list.append(`<li class="list-group-item text-secondary">No hay canciones</li>`);
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


    $(document).ready(() => Music.init());
    
    // Modal close handlers
    $(document).on('click', '#artistModalClose', () => {
        $('#artistModal').removeClass('active');
    });

    $(document).on('click', '#artistModal .crmp-modal-backdrop', () => {
        $('#artistModal').removeClass('active');
    });
})();

