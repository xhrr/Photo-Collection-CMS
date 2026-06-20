/**
 * 摄影师主页 — 模块化渲染引擎
 * 依赖: config.js（SITE_CONFIG）
 * 功能: 基于 modules 数组动态渲染页面板块，支持无限模块
 */
(function () {
    'use strict';

    const C = SITE_CONFIG;
    const modules = C.modules && C.modules.length > 0
        ? C.modules
        : buildDefaultModules();

    /* ===================================================================
       0. 默认模块列表（向后兼容）
       =================================================================== */

    function buildDefaultModules() {
        const list = [
            { type: 'hero', visible: true },
            { type: 'works', visible: true }
        ];
        if (C.about && C.about.visible !== false) {
            list.push({ type: 'about', visible: true });
        }
        list.push({ type: 'footer', visible: true });
        return list;
    }

    /* ===================================================================
       1. 模块渲染器注册表
       =================================================================== */

    const R = {};

    R.hero = function (mod, idx) {
        const heroImg = C.hero && C.hero.image;
        const heroUrl = safeUrl(heroImg, 'image');
        return `
<section class="hero" id="hero" data-module="hero">
    <div class="hero__bg">
        <img src="${heroUrl}" alt="">
    </div>
    <div class="hero__overlay"></div>
    <div class="hero__content">
        <h1 class="hero__name">${esc(C.photographer.name)}</h1>
        <p class="hero__tagline">${esc(C.photographer.tagline)}</p>
    </div>
    <div class="hero__scroll">
        <span>${esc(C.hero && C.hero.scrollHint || '')}</span>
        <div class="hero__scroll-line"></div>
    </div>
</section>`;
    };

    R.works = function (mod, idx) {
        const items = C.works && C.works.items || [];
        const heading = (mod && mod.heading) || (C.works && C.works.heading) || '精选作品';
        return `
<section class="section" id="works" data-module="works">
    <div class="section__header" id="worksHeader">
        <p class="section__label">精选作品</p>
        <h2 class="section__title">${esc(heading)}</h2>
    </div>
    <div class="works-grid" id="worksGrid" data-module-works>
        ${items.map(function (item, i) {
            var layout = normalizeChoice(item.layout, ['default', 'featured', 'tall'], 'default');
            var layoutClass = 'work-card--' + layout;
            var count = (item.images && item.images.length) || 0;
            var countText = count > 0 ? ' · ' + count + ' 张' : '';
            var imageUrl = safeUrl(item.image, 'image');
            return '<a href="/gallery.html?work=' + i + '" class="work-card ' + layoutClass + '" data-delay="' + (i * 0.1).toFixed(1) + '">'
                + '<img class="work-card__image" src="' + imageUrl + '" alt="' + esc(item.title || '作品封面') + '" loading="lazy"'
                    + ' onerror="this.style.display=\'none\';this.parentNode.classList.add(\'img-placeholder\');this.parentNode.setAttribute(\'data-placeholder\',\'[ 图片占位 ]\')">'
                + '<div class="work-card__overlay">'
                    + '<span class="work-card__title">' + esc(item.title) + '</span>'
                    + '<span class="work-card__category">' + esc(item.category) + countText + '</span>'
                + '</div>'
            + '</a>';
        }).join('')}
    </div>
</section>`;
    };

    R.about = function (mod, idx) {
        if (C.about && C.about.visible === false && (!mod || mod.visible !== false)) return '';
        var visible = mod ? mod.visible !== false : (C.about ? C.about.visible !== false : false);
        if (!visible) return '';

        var role = C.about && C.about.role || '';
        var bio = C.about && C.about.bio || [];
        var stats = C.about && C.about.stats || [];
        var aboutImg = C.aboutImage || '';
        var aboutUrl = safeUrl(aboutImg, 'image');

        return `
<section class="section" id="about" data-module="about">
    <div class="section__header" id="aboutHeader">
        <p class="section__label">关于我</p>
        <h2 class="section__title">以光为笔，<em>以影为墨</em></h2>
    </div>
    <div class="about-grid">
        <div class="about-image" id="aboutImage">
            <img src="${aboutUrl}" alt="${esc(C.photographer.name || '摄影师')}肖像">
        </div>
        <div class="about-content" id="aboutContent">
            <h3 class="about-content__name">${esc(C.photographer.name)}</h3>
            <p class="about-content__role">${esc(role)}</p>
            <div class="about-content__bio">${bio.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('')}</div>
            <div class="about-content__detail">${stats.map(function (s) {
                return '<div class="about-content__detail-item">'
                    + '<p class="about-content__detail-label">' + esc(s.label) + '</p>'
                    + '<p class="about-content__detail-value">' + esc(s.value) + '</p>'
                + '</div>';
            }).join('')}</div>
        </div>
    </div>
</section>`;
    };

    R.text = function (mod, idx) {
        if (!mod || mod.visible === false) return '';
        if (mod.content === undefined && mod.text === undefined) return '';
        var content = sanitizeHtml(mod.content || mod.text || '');
        var label = mod.label || '';
        return `
<section class="section section--text" id="module-text-${idx}" data-module="text">
    <div class="section__header">
        ${label ? '<p class="section__label">' + esc(label) + '</p>' : ''}
    </div>
    <div class="text-module__content">${content}</div>
</section>`;
    };

    R.images = function (mod, idx) {
        if (!mod || mod.visible === false) return '';
        var list = mod.images || [];
        if (list.length === 0) return '';
        var label = mod.label || '';
        var layout = normalizeChoice(mod.layout, ['grid', 'wide', 'single'], 'grid');

        return `
<section class="section section--images" id="module-images-${idx}" data-module="images">
    <div class="section__header">
        ${label ? '<p class="section__label">' + esc(label) + '</p>' : ''}
    </div>
    <div class="images-module__grid images-module__grid--${esc(layout)}" data-module-images>
        ${list.map(function (url) {
            var imageUrl = safeUrl(url, 'image');
            return '<div class="images-module__item">'
                + '<img src="' + imageUrl + '" alt="' + esc(label || '图片') + '" loading="lazy"'
                    + ' onerror="this.style.display=\'none\'">'
            + '</div>';
        }).join('')}
    </div>
</section>`;
    };

    R.footer = function (mod, idx) {
        var links = C.social && C.social.links || [];
        var copyright = C.footer && C.footer.copyright || '';
        return `
<footer class="footer" id="footer" data-module="footer">
    <div class="footer__inner">
        <p class="footer__brand">${esc(C.photographer.nameEn)}</p>
        <div class="footer__social">${links.map(function (link) {
            var href = safeUrl(link.url, 'link') || '#';
            return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + esc(link.name) + '</a>';
        }).join('')}</div>
        <p class="footer__copy">${esc(copyright)}</p>
    </div>
</footer>`;
    };

    /* ===================================================================
       2. 渲染引擎
       =================================================================== */

    function initContent() {
        document.title = C.photographer.name + ' | ' + C.photographer.tagline;
        // Nav logo
        var logo = document.querySelector('.nav__logo');
        if (logo) logo.textContent = C.photographer.nameEn;

        var app = document.getElementById('app');
        if (!app) return;

        // 收集可见模块
        var visibleModules = [];
        modules.forEach(function (mod) {
            if (mod.visible === false) return;
            if (R[mod.type]) visibleModules.push(mod);
        });

        // 渲染所有模块到 #app
        var html = '';
        visibleModules.forEach(function (mod, idx) {
            html += R[mod.type](mod, idx) || '';
        });
        app.innerHTML = html;

        // 重建导航链接
        rebuildNavLinks(visibleModules);

        // 绑定交互
        bindInteractions();

        // 启动观察器
        requestAnimationFrame(function () {
            requestAnimationFrame(observeElements);
        });
    }

    /* ===================================================================
       3. 动态导航链接
       =================================================================== */

    function rebuildNavLinks(visibleModules) {
        var container = document.getElementById('navLinks');
        if (!container) return;

        var linkMap = {
            hero: { href: '#hero', text: '首页' },
            works: { href: '#works', text: '作品' },
            about: { href: '#about', text: '关于' },
            footer: { href: '#footer', text: '联系' }
        };

        var links = [];
        visibleModules.forEach(function (mod) {
            var def = linkMap[mod.type];
            if (def) links.push('<li><a class="nav__link" href="' + def.href + '">' + def.text + '</a></li>');

            // 自定义文本模块也添加导航
            if (mod.type === 'text' && mod.nav !== false && mod.label) {
                var id = '#module-text-' + modules.indexOf(mod);
                links.push('<li><a class="nav__link" href="' + id + '">' + esc(mod.label) + '</a></li>');
            }
            if (mod.type === 'images' && mod.nav !== false && mod.label) {
                var id = '#module-images-' + modules.indexOf(mod);
                links.push('<li><a class="nav__link" href="' + id + '">' + esc(mod.label) + '</a></li>');
            }
        });

        container.innerHTML = links.join('');
    }

    /* ===================================================================
       4. 交互行为
       =================================================================== */

    function bindInteractions() {
        // Navigation scroll effect
        var nav = document.getElementById('nav');
        if (!nav) return;

        function handleNavScroll() {
            var scrolled = window.scrollY > 80;
            nav.classList.toggle('nav--visible', scrolled);
            nav.classList.toggle('nav--scrolled', scrolled);
        }
        window.addEventListener('scroll', handleNavScroll, { passive: true });
        handleNavScroll();

        // Mobile nav toggle
        var navToggle = document.getElementById('navToggle');
        var navLinks = document.getElementById('navLinks');
        if (!navToggle || !navLinks) return;

        function closeMobileNav() {
            navToggle.classList.remove('nav__toggle--active');
            navLinks.classList.remove('nav__links--open');
            navToggle.setAttribute('aria-expanded', 'false');
        }

        navToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = !navLinks.classList.contains('nav__links--open');
            navToggle.classList.toggle('nav__toggle--active', open);
            navLinks.classList.toggle('nav__links--open', open);
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        navLinks.querySelectorAll('.nav__link').forEach(function (link) {
            link.addEventListener('click', closeMobileNav);
        });

        document.addEventListener('click', function (e) {
            if (!nav.contains(e.target) && navLinks.classList.contains('nav__links--open')) {
                closeMobileNav();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navLinks.classList.contains('nav__links--open')) {
                closeMobileNav();
            }
        });

        // Hero parallax
        var hero = document.getElementById('hero');
        var heroBg = hero && hero.querySelector('.hero__bg');
        if (heroBg) {
            window.addEventListener('scroll', function () {
                var scrollY = window.scrollY;
                var heroH = hero.offsetHeight;
                if (scrollY <= heroH) {
                    heroBg.style.transform = 'translateY(' + (scrollY * 0.4) + 'px)';
                    heroBg.style.opacity = 1 - (scrollY / heroH) * 0.3;
                }
            }, { passive: true });
        }
    }

    /* ===================================================================
       5. 滚动动画观察器
       =================================================================== */

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;

            if (el.classList.contains('section__header')) {
                el.classList.add('section__header--visible');
            } else if (el.classList.contains('work-card')) {
                var delay = parseFloat(el.dataset.delay) || 0;
                setTimeout(function () { el.classList.add('work-card--visible'); }, delay * 1000);
            } else if (el.classList.contains('about-image')) {
                el.classList.add('about-image--visible');
            } else if (el.classList.contains('about-content')) {
                el.classList.add('about-content--visible');
            } else if (el.classList.contains('reveal')) {
                el.classList.add('reveal--visible');
            }
            observer.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    function observeElements() {
        document.querySelectorAll('.section__header, .work-card').forEach(function (el) { observer.observe(el); });
        var aboutImg = document.querySelector('.about-image');
        var aboutContent = document.querySelector('.about-content');
        if (aboutImg) observer.observe(aboutImg);
        if (aboutContent) observer.observe(aboutContent);
    }

    /* ===================================================================
       6. 工具函数
       =================================================================== */

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

    function normalizeChoice(value, allowed, fallback) {
        return allowed.indexOf(value) >= 0 ? value : fallback;
    }

    function sanitizeHtml(html) {
        if (typeof html !== 'string' || !html.trim()) return '';

        var template = document.createElement('template');
        template.innerHTML = html;
        var allowedTags = {
            A: ['href', 'title', 'target', 'rel'],
            B: [], STRONG: [], I: [], EM: [], U: [], BR: [],
            P: [], H1: [], H2: [], H3: [], H4: [],
            UL: [], OL: [], LI: [], BLOCKQUOTE: [],
            FIGURE: [], FIGCAPTION: [],
            IMG: ['src', 'alt', 'title', 'loading'],
            SPAN: [], SMALL: [], CODE: [], PRE: []
        };

        Array.from(template.content.querySelectorAll('*')).forEach(function (node) {
            if (!allowedTags[node.tagName]) {
                node.replaceWith.apply(node, Array.from(node.childNodes));
                return;
            }

            Array.from(node.attributes).forEach(function (attr) {
                var name = attr.name.toLowerCase();
                if (name.indexOf('on') === 0 || name === 'style' || name === 'class' || name === 'id') {
                    node.removeAttribute(attr.name);
                    return;
                }
                if (allowedTags[node.tagName].indexOf(name) === -1) {
                    node.removeAttribute(attr.name);
                    return;
                }
                if (name === 'href') {
                    var href = cleanUrl(attr.value, 'link');
                    href ? node.setAttribute('href', href) : node.removeAttribute('href');
                }
                if (name === 'src') {
                    var src = cleanUrl(attr.value, 'image');
                    src ? node.setAttribute('src', src) : node.removeAttribute('src');
                }
            });

            if (node.tagName === 'A') {
                node.setAttribute('rel', 'noopener noreferrer');
                if (node.getAttribute('target') !== '_blank') node.removeAttribute('target');
            }
            if (node.tagName === 'IMG' && !node.getAttribute('loading')) {
                node.setAttribute('loading', 'lazy');
            }
        });

        return template.innerHTML;
    }

    /* ===================================================================
       7. 启动
       =================================================================== */

    initContent();

})();
