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
        var imageUrl = safeUrl(src, 'image');
        html +=
            '<button class="gallery-item" type="button" data-index="' + i + '" aria-label="查看第 ' + (i + 1) + ' 张图片">' +
                '<img src="' + imageUrl + '" alt="' + esc(work.title || '图集图片') + ' ' + (i + 1) + '" loading="lazy"' +
                    ' onerror="this.style.display=\'none\'">' +
                '<div class="gallery-item__overlay">' +
                    '<div class="gallery-item__icon">+</div>' +
                '</div>' +
            '</button>';
    });
    grid.innerHTML = html;

    // Lightbox
    var lightbox = document.getElementById('lightbox');
    var lightboxImage = document.getElementById('lightboxImage');
    var lightboxCounter = document.getElementById('lightboxCounter');
    var lightboxClose = document.getElementById('lightboxClose');
    var lastFocused = null;

    function openLightbox(index) {
        lastFocused = document.activeElement;
        currentIndex = index;
        lightboxImage.src = cleanUrl(images[currentIndex], 'image');
        lightboxImage.alt = (work.title || '图集图片') + ' ' + (currentIndex + 1);
        lightboxCounter.textContent = (currentIndex + 1) + ' / ' + images.length;
        lightbox.classList.add('lightbox--active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        lightboxClose.focus();
    }

    function closeLightbox() {
        lightbox.classList.remove('lightbox--active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    function navigateLightbox(dir) {
        currentIndex = (currentIndex + dir + images.length) % images.length;
        lightboxImage.src = cleanUrl(images[currentIndex], 'image');
        lightboxImage.alt = (work.title || '图集图片') + ' ' + (currentIndex + 1);
        lightboxCounter.textContent = (currentIndex + 1) + ' / ' + images.length;
    }

    // Click events
    document.querySelectorAll('.gallery-item').forEach(function (item) {
        item.addEventListener('click', function () {
            openLightbox(parseInt(item.dataset.index));
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', function () { navigateLightbox(-1); });
    document.getElementById('lightboxNext').addEventListener('click', function () { navigateLightbox(1); });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('lightbox--active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
        if (e.key === 'Tab') trapLightboxFocus(e);
    });

    // Click outside to close
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target.classList.contains('lightbox__content')) {
            closeLightbox();
        }
    });

    lightbox.setAttribute('aria-hidden', 'true');

    function trapLightboxFocus(e) {
        var focusable = lightbox.querySelectorAll('button, [href], img[tabindex]');
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function esc(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function safeUrl(value, kind) {
        return esc(cleanUrl(value, kind));
    }

    function cleanUrl(value, kind) {
        if (typeof value !== 'string') return '';
        var raw = value.trim();
        if (!raw) return '';
        if (raw[0] === '#') return raw;
        if (raw[0] === '/' && raw[1] !== '/') return raw;

        try {
            var url = new URL(raw, window.location.origin);
            var allowed = kind === 'image'
                ? ['http:', 'https:', 'data:']
                : ['http:', 'https:', 'mailto:', 'tel:'];
            if (allowed.indexOf(url.protocol) === -1) return '';
            if (url.protocol === 'data:' && !/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(raw)) return '';
            return raw;
        } catch (e) {
            return '';
        }
    }

})();
