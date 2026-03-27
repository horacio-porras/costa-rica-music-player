(() => {
    $(document).ready(() => {
        if (window.Home && typeof window.Home.init === 'function') {
            window.Home.init();
        }
    });
})();
