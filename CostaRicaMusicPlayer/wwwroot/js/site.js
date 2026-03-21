// Eventos delegados para modales de Artista y Álbum (canciones reproducibles y agregar a playlist)
(function () {
    $(document).ready(function () {
        // Reproducir canción al hacer clic en la fila (título o duración), excluyendo el dropdown
        $(document).on('click', '#artistModal .media-modal-song-item, #albumModal .media-modal-song-item', function (e) {
            if ($(e.target).closest('.dropdown, .media-modal-more-btn').length) return;
            e.stopPropagation();
            const row = $(this);
            const modal = row.closest('.modal');
            const songs = modal.data('modal-songs');
            const index = parseInt(row.data('song-index'), 10);
            if (!songs || !Array.isArray(songs) || index < 0 || index >= songs.length) return;
            const song = songs[index];
            if (song && window.Player) {
                window.Player.reproducir(song, songs);
            }
        });

        // Agregar a playlist desde el menú de 3 puntos
        $(document).on('click', '#artistModal .media-modal-add-to-playlist, #albumModal .media-modal-add-to-playlist', async function (e) {
            e.preventDefault();
            const index = parseInt($(this).data('song-index'), 10);
            const modal = $(this).closest('.modal');
            const songs = modal.data('modal-songs');
            if (!songs || !Array.isArray(songs) || index < 0 || index >= songs.length) return;
            const song = songs[index];
            if (song && window.Player) {
                await window.Player.agregarCancionAPlaylist(song);
            }
        });
    });
})();
