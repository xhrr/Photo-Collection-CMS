/**
 * Gallery Page — 图集页面脚本
 * 从 URL 参数读取 work index，展示对应图集
 */
(function () {
    'use strict';

    var C = SITE_CONFIG;
    var currentIndex = 0;
    var images = [];

    // Get work index from URL
    var params = new URLSearchParams(window.location.search);
    var workIndex = parseInt(params.get('work'));

    if (isNaN(workIndex) || !C.works.items[workIndex]) {
        document.getElementById('galleryGrid').innerHTML =
            '<p style="color:#888;text-align:center;padding:4rem 0">未找到该图集</p>';
        return;
    }

    var work = C.works.items[workIndex];
    images = work.images && work.images.length > 0 ? work.images : [work.image];

    // Set page title
    document.title = work.title + ' | ' + (C.photographer.nameEn || 'Gallery');
    document.getElementById('galleryTitle').textContent = work.title;
    document.getElementById('galleryCategory').textContent = work.category;

    // Render gallery grid
    var grid = document.getElementById('galleryGrid');
    var html = '';
    images.forEach(function (src, i) {
        html +=
            '<div class="gallery-item" data-index="' + i + '">' +
                '<img src="' + src + '" alt="" loading="lazy"' +
                    ' onerror="this.style.display=\'none\'">' +
                '<div class="gallery-item__overlay">' +
                    '<div class="gallery-item__icon">+</div>' +
                '</div>' +
            '</div>';
    });
    grid.innerHTML = html;

    // Lightbox
    var lightbox = document.getElementById('lightbox');
    var lightboxImage = document.getElementById('lightboxImage');
    var lightboxCounter = document.getElementById('lightboxCounter');

    function openLightbox(index) {
        currentIndex = index;
        lightboxImage.src = images[currentIndex];
        lightboxCounter.textContent = (currentIndex + 1) + ' / ' + images.length;
        lightbox.classList.add('lightbox--active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('lightbox--active');
        document.body.style.overflow = '';
    }

    function navigateLightbox(dir) {
        currentIndex = (currentIndex + dir + images.length) % images.length;
        lightboxImage.src = images[currentIndex];
        lightboxCounter.textContent = (currentIndex + 1) + ' / ' + images.length;
    }

    // Click events
    document.querySelectorAll('.gallery-item').forEach(function (item) {
        item.addEventListener('click', function () {
            openLightbox(parseInt(item.dataset.index));
        });
    });

    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', function () { navigateLightbox(-1); });
    document.getElementById('lightboxNext').addEventListener('click', function () { navigateLightbox(1); });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('lightbox--active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    // Click outside to close
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target.classList.contains('lightbox__content')) {
            closeLightbox();
        }
    });

})();
