document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('hamburger-icon');

    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('active');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });
    }
});
