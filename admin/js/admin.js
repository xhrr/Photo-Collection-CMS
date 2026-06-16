/**
 * Photo Collection CMS — 管理后台编辑器
 */
(function () {
    'use strict';

    let config = null;
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    /* ===================================================================
       1. 初始化
       =================================================================== */

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        await loadConfig();
        renderAll();
        bindGlobal();
    }

    /* ===================================================================
       2. 配置读写
       =================================================================== */

    async function loadConfig() {
        const res = await fetch('/api/config');
        config = await res.json();
    }

    async function saveConfig() {
        collectAll();
        const btn = $('#btnSave');
        btn.disabled = true;
        try {
            const res = await fetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                showToast('保存成功', 'success');
                showSaveStatus();
            } else {
                const data = await res.json();
                showToast(data.error || '保存失败', 'error');
            }
        } catch (err) {
            showToast('保存失败: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function autoSave() {
        collectAll();
        try {
            await fetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
        } catch (e) { /* 静默失败 */ }
    }

    function showSaveStatus() {
        const el = $('#saveStatus');
        el.textContent = '已保存';
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 2000);
    }

    /* ===================================================================
       3. 图片上传
       =================================================================== */

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                showToast('图片上传成功', 'success');
                return data.url;
            }
            showToast(data.error || '上传失败', 'error');
        } catch (err) {
            showToast('上传失败: ' + err.message, 'error');
        }
        return null;
    }

    function bindImageUpload(fileId, urlId, previewId) {
        const fileInput = document.getElementById(fileId);
        const urlInput = document.getElementById(urlId);
        if (!fileInput) return;

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;
            const url = await uploadImage(file);
            if (url) {
                urlInput.value = url;
                updatePreview(previewId, url);
                autoSave();
            }
        });
    }

    function updatePreview(elOrId, url) {
        const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
        if (!el) return;
        el.innerHTML = url ? `<img src="${esc(url)}" onerror="this.style.display='none'">` : '';
    }

    /* ===================================================================
       4. 渲染函数
       =================================================================== */

    function renderAll() {
        renderPhotographer();
        renderHero();
        renderWorks();
        renderAbout();
        renderSocial();
        renderFooter();
        renderModules();
        renderThemes();
        renderMedia();
        renderExport();
    }

    // ---------- 摄影师信息 ----------

    function renderPhotographer() {
        $('#section-photographer').innerHTML = `
            <div class="section-header">
                <h3 class="section-header__title">摄影师信息</h3>
                <p class="section-header__desc">个人基本信息展示</p>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>中文名</label>
                    <input type="text" id="p-name" value="${esc(config.photographer.name)}">
                </div>
                <div class="form-group">
                    <label>英文名</label>
                    <input type="text" id="p-nameEn" value="${esc(config.photographer.nameEn)}">
                </div>
            </div>
            <div class="form-group">
                <label>定位语</label>
                <input type="text" id="p-tagline" value="${esc(config.photographer.tagline)}">
            </div>
        `;
    }

    // ---------- 首页大图 ----------

    function renderHero() {
        $('#section-hero').innerHTML = `
            <div class="section-header">
                <h3 class="section-header__title">首页大图</h3>
                <p class="section-header__desc">全屏 Hero 背景图设置</p>
            </div>
            <div class="form-group">
                <label>背景图片</label>
                <div class="image-input">
                    <input type="text" id="hero-image" value="${esc(config.hero.image)}" placeholder="图片 URL">
                    <input type="file" id="hero-file" accept="image/*" class="file-input">
                    <button class="btn btn--ghost btn--sm" onclick="document.getElementById('hero-file').click()">上传</button>
                </div>
                <div class="image-preview" id="hero-preview">
                    ${previewImg(config.hero.image)}
                </div>
            </div>
            <div class="form-group">
                <label>滚动提示文字</label>
                <input type="text" id="hero-scroll" value="${esc(config.hero.scrollHint)}">
            </div>
        `;
        bindImageUpload('hero-file', 'hero-image', 'hero-preview');
        $('#hero-image').addEventListener('input', () => updatePreview('hero-preview', $('#hero-image').value));
    }

    // ---------- 精选作品 ----------

    function renderWorks() {
        const el = $('#section-works');
        el.innerHTML = `
            <div class="section-header">
                <h3 class="section-header__title">精选作品</h3>
                <p class="section-header__desc">管理作品展示列表</p>
            </div>
            <div class="form-group">
                <label>区域标题</label>
                <input type="text" id="works-heading" value="${esc(config.works.heading)}">
            </div>
            <div class="list-divider">
                <span class="list-divider__label">作品列表</span>
                <button class="btn btn--ghost btn--sm" id="btnAddWork">+ 添加作品</button>
            </div>
            <div id="works-list">
                ${config.works.items.map((item, i) => renderWorkItem(item, i)).join('')}
            </div>
        `;

        $('#btnAddWork').addEventListener('click', () => {
            config.works.items.push({ title: '新作品', category: '', image: '', layout: 'default', images: [] });
            renderWorks();
        });
        bindWorkItemEvents();
    }

    function renderWorkItem(item, index) {
        const layouts = [
            { value: 'default', label: '普通' },
            { value: 'featured', label: '通栏' },
            { value: 'tall', label: '双行高' }
        ];
        const images = item.images || [];
        const total = config.works.items.length;

        return `
            <div class="work-item" data-index="${index}">
                <div class="work-item__header" onclick="this.parentElement.classList.toggle('work-item--expanded')">
                    <span class="work-item__name">${esc(item.title) || '新作品'}</span>
                    <div class="work-item__actions">
                        ${index > 0 ? actionBtn('up', '上移', '↑') : ''}
                        ${index < total - 1 ? actionBtn('down', '下移', '↓') : ''}
                        ${actionBtn('remove', '删除', '×', true)}
                    </div>
                </div>
                <div class="work-item__body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>标题</label>
                            <input type="text" data-field="title" value="${esc(item.title)}">
                        </div>
                        <div class="form-group">
                            <label>分类</label>
                            <input type="text" data-field="category" value="${esc(item.category)}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>布局模式</label>
                        <select data-field="layout">
                            ${layouts.map(o => `<option value="${o.value}" ${item.layout === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                        </select>
                    </div>
                    ${imageField('封面图片', 'image', item.image, 'work-file-input', 'work-upload-btn', 'work-preview')}
                    <div class="list-divider">
                        <span class="list-divider__label">图集图片 (<span data-gallery-count="${index}">${images.length}</span> 张)</span>
                        <button class="btn btn--accent btn--sm" data-add-gallery="${index}">+ 添加图片</button>
                    </div>
                    ${galleryAddPanel(index)}
                    <div class="gallery-images-list" data-gallery-list="${index}">
                        ${images.map((img, i) => galleryItem(img, i)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function actionBtn(action, title, text, isDanger = false) {
        const cls = isDanger ? 'btn--icon btn--icon--danger' : 'btn--icon';
        return `<button class="${cls}" data-action="${action}" title="${title}">${text}</button>`;
    }

    function imageField(label, field, value, fileClass, uploadClass, previewClass) {
        return `
            <div class="form-group">
                <label>${label}</label>
                <div class="image-input">
                    <input type="text" data-field="${field}" value="${esc(value)}" placeholder="图片 URL">
                    <input type="file" accept="image/*" class="file-input ${fileClass}">
                    <button class="btn btn--ghost btn--sm ${uploadClass}">上传</button>
                </div>
                <div class="image-preview ${previewClass}">
                    ${previewImg(value)}
                </div>
            </div>
        `;
    }

    function galleryAddPanel(index) {
        return `
            <div class="gallery-add-panel" data-add-panel="${index}" style="display:none">
                <div class="gallery-add-panel__row">
                    <input type="file" accept="image/*" multiple class="file-input" data-panel-file="${index}">
                    <button class="btn btn--ghost btn--sm" data-panel-upload="${index}">选择本地文件</button>
                    <span class="gallery-add-panel__or">或</span>
                </div>
                <div class="gallery-add-panel__row">
                    <textarea data-panel-urls="${index}" placeholder="输入图片链接，多个链接换行分隔" rows="3"></textarea>
                </div>
                <div class="gallery-add-panel__actions">
                    <button class="btn btn--primary btn--sm" data-panel-confirm="${index}">确认添加</button>
                    <button class="btn btn--ghost btn--sm" data-panel-cancel="${index}">取消</button>
                </div>
            </div>
        `;
    }

    function galleryItem(img, i) {
        return `
            <div class="gallery-image-item" data-gallery-index="${i}">
                <img src="${esc(img)}" onerror="this.style.display='none'">
                <input type="text" data-gallery-url="${i}" value="${esc(img)}" placeholder="图片 URL">
                <button class="btn--icon btn--icon--danger" data-remove-gallery="${i}" title="删除">×</button>
            </div>
        `;
    }

    function appendGalleryImages(workIndex, urls) {
        const list = document.querySelector(`[data-gallery-list="${workIndex}"]`);
        if (!list) return;
        if (!config.works.items[workIndex].images) config.works.items[workIndex].images = [];

        const startIndex = config.works.items[workIndex].images.length;
        urls.forEach((url, i) => {
            if (!url.trim()) return;
            config.works.items[workIndex].images.push(url.trim());
            const div = document.createElement('div');
            div.innerHTML = galleryItem(url.trim(), startIndex + i);
            const item = div.firstElementChild;
            list.appendChild(item);
            bindGalleryItemEvents(item, workIndex);
        });
        updateGalleryCount(workIndex);
    }

    function bindGalleryItemEvents(item, workIndex) {
        const removeBtn = item.querySelector('[data-remove-gallery]');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                const idx = parseInt(removeBtn.dataset.removeGallery);
                config.works.items[workIndex].images.splice(idx, 1);
                item.remove();
                reindexGalleryItems(workIndex);
            });
        }
        const urlInput = item.querySelector('[data-gallery-url]');
        if (urlInput) {
            urlInput.addEventListener('change', () => {
                const idx = parseInt(urlInput.dataset.galleryUrl);
                if (config.works.items[workIndex].images) {
                    config.works.items[workIndex].images[idx] = urlInput.value;
                }
                const preview = item.querySelector('img');
                if (preview) preview.src = urlInput.value;
            });
        }
    }

    function reindexGalleryItems(workIndex) {
        const list = document.querySelector(`[data-gallery-list="${workIndex}"]`);
        if (!list) return;
        list.querySelectorAll('.gallery-image-item').forEach((item, i) => {
            item.dataset.galleryIndex = i;
            const urlInput = item.querySelector('[data-gallery-url]');
            if (urlInput) urlInput.dataset.galleryUrl = i;
            const removeBtn = item.querySelector('[data-remove-gallery]');
            if (removeBtn) removeBtn.dataset.removeGallery = i;
        });
        updateGalleryCount(workIndex);
    }

    function updateGalleryCount(workIndex) {
        const countEl = document.querySelector(`[data-gallery-count="${workIndex}"]`);
        if (countEl) countEl.textContent = config.works.items[workIndex].images.length;
    }

    // ---------- 关于我 ----------

    function renderAbout() {
        const el = $('#section-about');
        const visible = config.about.visible !== false;

        el.innerHTML = `
            <div class="section-header">
                <h3 class="section-header__title">关于我</h3>
                <p class="section-header__desc">个人简介与数据展示</p>
            </div>
            <div class="form-group">
                <label class="toggle-label">
                    <input type="checkbox" id="about-visible" class="toggle-input" ${visible ? 'checked' : ''}>
                    <span class="toggle-switch"></span>
                    <span>显示此分区</span>
                </label>
            </div>
            <div id="about-fields" style="${visible ? '' : 'display:none'}">
                <div class="form-group">
                    <label>角色</label>
                    <input type="text" id="about-role" value="${esc(config.about.role)}">
                </div>
                <div class="list-divider">
                    <span class="list-divider__label">简介段落</span>
                    <button class="btn btn--ghost btn--sm" id="btnAddBio">+ 添加段落</button>
                </div>
                <div id="bio-list">
                    ${config.about.bio.map((p, i) => bioItem(p, i)).join('')}
                </div>
                <div class="list-divider">
                    <span class="list-divider__label">数据亮点</span>
                    <button class="btn btn--ghost btn--sm" id="btnAddStat">+ 添加数据</button>
                </div>
                <div id="stats-list">
                    ${config.about.stats.map((s, i) => statItem(s, i)).join('')}
                </div>
                ${imageField('肖像图片', 'about-image', config.aboutImage, '', '', 'about-preview')}
            </div>
        `;

        // 显隐开关
        $('#about-visible').addEventListener('change', e => {
            $('#about-fields').style.display = e.target.checked ? '' : 'none';
        });

        // 段落操作
        $('#btnAddBio').addEventListener('click', () => { config.about.bio.push(''); renderAbout(); });
        $$('[data-remove-bio]').forEach(btn => {
            btn.addEventListener('click', () => { config.about.bio.splice(parseInt(btn.dataset.removeBio), 1); renderAbout(); });
        });

        // 数据操作
        $('#btnAddStat').addEventListener('click', () => { config.about.stats.push({ label: '', value: '' }); renderAbout(); });
        $$('[data-remove-stat]').forEach(btn => {
            btn.addEventListener('click', () => { config.about.stats.splice(parseInt(btn.dataset.removeStat), 1); renderAbout(); });
        });

        // 图片上传
        const fileInput = document.querySelector('#section-about .file-input');
        if (fileInput) {
            fileInput.addEventListener('change', async () => {
                const file = fileInput.files[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) {
                    $('#about-image').value = url;
                    updatePreview('about-preview', url);
                    autoSave();
                }
            });
        }
        const urlInput = $('#about-image');
        if (urlInput) urlInput.addEventListener('input', () => updatePreview('about-preview', urlInput.value));
    }

    function bioItem(text, i) {
        return `
            <div class="list-item" data-index="${i}">
                <div class="form-group">
                    ${i === 0 ? '<label>段落</label>' : ''}
                    <textarea data-bio-index="${i}">${esc(text)}</textarea>
                </div>
                <button class="btn--icon btn--icon--danger list-item__remove" data-remove-bio="${i}" title="删除">×</button>
            </div>
        `;
    }

    function statItem(stat, i) {
        return `
            <div class="list-item" data-index="${i}">
                <div class="form-group">
                    ${i === 0 ? '<label>标签</label>' : ''}
                    <input type="text" data-stat-label="${i}" value="${esc(stat.label)}">
                </div>
                <div class="form-group">
                    ${i === 0 ? '<label>数值</label>' : ''}
                    <input type="text" data-stat-value="${i}" value="${esc(stat.value)}">
                </div>
                <button class="btn--icon btn--icon--danger list-item__remove" data-remove-stat="${i}" title="删除">×</button>
            </div>
        `;
    }

    // ---------- 社交链接 ----------

    function renderSocial() {
        const el = $('#section-social');
        el.innerHTML = `
            <div class="section-header">
                <h3 class="section-header__title">社交链接</h3>
                <p class="section-header__desc">社交媒体链接管理</p>
            </div>
            <div class="list-divider">
                <span class="list-divider__label">链接列表</span>
                <button class="btn btn--ghost btn--sm" id="btnAddSocial">+ 添加链接</button>
            </div>
            <div id="social-list">
                ${config.social.links.map((link, i) => socialItem(link, i)).join('')}
            </div>
        `;

        $('#btnAddSocial').addEventListener('click', () => { config.social.links.push({ name: '', url: '' }); renderSocial(); });
        $$('[data-remove-social]').forEach(btn => {
            btn.addEventListener('click', () => { config.social.links.splice(parseInt(btn.dataset.removeSocial), 1); renderSocial(); });
        });
    }

    function socialItem(link, i) {
        return `
            <div class="list-item" data-index="${i}">
                <div class="form-group">
                    ${i === 0 ? '<label>名称</label>' : ''}
                    <input type="text" data-social-name="${i}" value="${esc(link.name)}">
                </div>
                <div class="form-group">
                    ${i === 0 ? '<label>链接</label>' : ''}
                    <input type="text" data-social-url="${i}" value="${esc(link.url)}">
                </div>
                <button class="btn--icon btn--icon--danger list-item__remove" data-remove-social="${i}" title="删除">×</button>
            </div>
        `;
    }

    // ---------- 版权信息 ----------

    function renderFooter() {
        $('#section-footer').innerHTML = `
            <div class="section-header">
                <h3 class="section-header__title">版权信息</h3>
                <p class="section-header__desc">页脚版权声明</p>
            </div>
            <div class="form-group">
                <label>版权文字</label>
                <input type="text" id="footer-copy" value="${esc(config.footer.copyright)}">
            </div>
        `;
    }

    // ---------- 模块管理 ----------

    let expandedModuleIndex = null;

    const MODULE_TYPES = [
        { type: 'hero', label: '首页大图', icon: '◉', summary: '封面大图与主标题' },
        { type: 'works', label: '精选作品', icon: '▣', summary: '作品网格与图集入口' },
        { type: 'about', label: '关于我', icon: '◎', summary: '个人简介与数据亮点' },
        { type: 'text', label: '文本内容', icon: '¶', summary: '可编辑标题与 HTML 内容' },
        { type: 'images', label: '图片展示', icon: '⊞', summary: '可上传多图并选择布局' },
        { type: 'footer', label: '页脚', icon: '⌂', summary: '版权与社交链接' }
    ];

    const MODULE_TYPE_MAP = {};
    MODULE_TYPES.forEach(t => { MODULE_TYPE_MAP[t.type] = t; });

    const MODULE_PRESETS = [
        {
            key: 'text-intro',
            type: 'text',
            title: '引言文字',
            meta: '适合首页开场',
            desc: '带小标题和一段可直接改写的介绍文案。',
            preview: 'label+paragraph',
            create: () => ({
                type: 'text',
                visible: true,
                label: '引言',
                nav: true,
                content: '<p>在这里写下这组作品想表达的第一句话。可以是一段创作说明，也可以是一句更安静的自我介绍。</p>'
            })
        },
        {
            key: 'text-quote',
            type: 'text',
            title: '引用段落',
            meta: '适合情绪锚点',
            desc: '自带大号引用样式，用来放一句摄影宣言或章节题记。',
            preview: 'quote',
            create: () => ({
                type: 'text',
                visible: true,
                label: '题记',
                nav: true,
                content: '<blockquote>我想让照片保留那些即将消失的光。</blockquote><p>把这句话替换成你的创作理念，或者删除下面这段说明。</p>'
            })
        },
        {
            key: 'images-grid',
            type: 'images',
            title: '图片网格',
            meta: '适合系列展示',
            desc: '创建后直接出现图片管理 UI，可上传或粘贴多张图片。',
            preview: 'grid',
            create: () => ({
                type: 'images',
                visible: true,
                label: '作品欣赏',
                nav: true,
                layout: 'grid',
                images: []
            })
        },
        {
            key: 'images-wide',
            type: 'images',
            title: '宽幅图片',
            meta: '适合横图叙事',
            desc: '默认使用宽屏双列布局，更适合风景、街景和项目切片。',
            preview: 'wide',
            create: () => ({
                type: 'images',
                visible: true,
                label: '现场片段',
                nav: true,
                layout: 'wide',
                images: []
            })
        },
        {
            key: 'hero',
            type: 'hero',
            title: '首页大图',
            meta: '唯一模块',
            desc: '恢复或显示首页封面模块，图片和文字在“首页大图”页签维护。',
            preview: 'hero',
            singleton: true
        },
        {
            key: 'works',
            type: 'works',
            title: '精选作品',
            meta: '唯一模块',
            desc: '恢复或显示作品网格模块，作品内容在“精选作品”页签维护。',
            preview: 'works',
            singleton: true
        },
        {
            key: 'about',
            type: 'about',
            title: '关于我',
            meta: '唯一模块',
            desc: '恢复或显示个人简介模块，内容在“关于我”页签维护。',
            preview: 'profile',
            singleton: true
        },
        {
            key: 'footer',
            type: 'footer',
            title: '页脚',
            meta: '唯一模块',
            desc: '恢复或显示页脚模块，包含版权和社交链接。',
            preview: 'footer',
            singleton: true
        }
    ];

    function renderModules() {
        ensureModules();
        const el = $('#section-modules');
        el.innerHTML = `
            <div class="section-header">
                <h3 class="section-header__title">模块管理</h3>
                <p class="section-header__desc">管理首页所有板块的顺序、显隐和内容</p>
            </div>
            <div class="module-starter">
                <div class="module-starter__head">
                    <div>
                        <p class="module-starter__eyebrow">添加模块</p>
                        <h4 class="module-starter__title">选择一个带编辑界面的模块模板</h4>
                    </div>
                    <span class="module-starter__hint">点击卡片后会自动插入并展开</span>
                </div>
                <div class="module-preset-grid">
                    ${MODULE_PRESETS.map(renderModulePreset).join('')}
                </div>
            </div>
            <div class="modules-list" id="modulesList">
                ${config.modules.map((mod, i) => renderModuleItem(mod, i)).join('')}
            </div>
        `;
        bindModuleEvents();
    }

    function renderModulePreset(preset) {
        const typeDef = MODULE_TYPE_MAP[preset.type] || { icon: '+', label: preset.type };
        const disabled = preset.singleton && config.modules.some(mod => mod.type === preset.type);
        const actionText = disabled ? '已存在，点击定位' : '添加';
        return `
            <button class="module-preset ${disabled ? 'module-preset--exists' : ''}" data-add-module="${preset.key}" type="button">
                <span class="module-preset__top">
                    <span class="module-preset__icon">${typeDef.icon}</span>
                    <span class="module-preset__meta">${esc(preset.meta)}</span>
                </span>
                <span class="module-preset__preview module-preset__preview--${esc(preset.preview)}" aria-hidden="true">
                    ${modulePresetPreview(preset.preview)}
                </span>
                <span class="module-preset__title">${esc(preset.title)}</span>
                <span class="module-preset__desc">${esc(preset.desc)}</span>
                <span class="module-preset__action">${actionText}</span>
            </button>
        `;
    }

    function modulePresetPreview(kind) {
        if (kind === 'quote') return '<i></i><b></b><b></b>';
        if (kind === 'grid') return '<i></i><i></i><i></i><i></i>';
        if (kind === 'wide') return '<i></i><i></i>';
        if (kind === 'hero') return '<i></i><b></b><b></b>';
        if (kind === 'works') return '<i></i><i></i><i></i>';
        if (kind === 'profile') return '<i></i><b></b><b></b><b></b>';
        if (kind === 'footer') return '<b></b><i></i><i></i><i></i>';
        return '<b></b><i></i><i></i>';
    }

    function ensureModules() {
        if (!config.modules || !Array.isArray(config.modules) || config.modules.length === 0) {
            config.modules = [
                { type: 'hero', visible: true },
                { type: 'works', visible: true },
                { type: 'about', visible: config.about ? config.about.visible !== false : false },
                { type: 'footer', visible: true }
            ];
        }
    }

    function renderModuleItem(mod, index) {
        const typeDef = MODULE_TYPE_MAP[mod.type] || { label: mod.type, icon: '?' };
        const total = config.modules.length;
        const visible = mod.visible !== false;
        const extra = moduleExtraFields(mod, index);
        const expandedClass = index === expandedModuleIndex ? ' module-item--expanded' : '';

        return `
            <div class="module-item${expandedClass}" data-module-index="${index}">
                <div class="module-item__header" onclick="this.parentElement.classList.toggle('module-item--expanded')">
                    <span class="module-item__drag" title="拖拽排序">⠿</span>
                    <span class="module-item__icon">${typeDef.icon}</span>
                    <span class="module-item__type">${esc(typeDef.label)}</span>
                    <span class="module-item__label">${esc(mod.label || mod.type)}</span>
                    <span class="module-item__summary">${esc(typeDef.summary || '')}</span>
                    <label class="module-item__toggle" title="显示/隐藏" onclick="event.stopPropagation()">
                        <input type="checkbox" class="module-toggle-input" data-toggle="${index}" ${visible ? 'checked' : ''}>
                        <span class="module-toggle-switch"></span>
                    </label>
                    <div class="module-item__actions" onclick="event.stopPropagation()">
                        ${index > 0 ? `<button class="btn--icon" data-move-up="${index}" title="上移">↑</button>` : ''}
                        ${index < total - 1 ? `<button class="btn--icon" data-move-down="${index}" title="下移">↓</button>` : ''}
                        <button class="btn--icon btn--icon--danger" data-remove-module="${index}" title="删除">×</button>
                    </div>
                </div>
                <div class="module-item__body">
                    ${extra}
                </div>
            </div>
        `;
    }

    function moduleExtraFields(mod, index) {
        if (mod.type === 'text' || mod.type === 'images') {
            let html = `<div class="form-group"><label>模块标题</label><input type="text" data-module-label="${index}" value="${esc(mod.label || '')}" placeholder="显示在板块上方"></div>`;
            html += `<div class="form-group"><label class="toggle-label"><input type="checkbox" class="toggle-input" data-module-nav="${index}" ${mod.nav !== false ? 'checked' : ''}><span class="toggle-switch"></span><span>在导航栏显示链接</span></label></div>`;
            if (mod.type === 'text') {
                html += `<div class="form-group"><label>内容（HTML 格式）</label><textarea class="module-textarea" data-module-content="${index}" rows="8">${esc(mod.content || '')}</textarea></div>`;
            }
            if (mod.type === 'images') {
                const layout = mod.layout || 'grid';
                html += `<div class="form-group"><label>布局</label><select data-module-layout="${index}">
                    <option value="grid" ${layout === 'grid' ? 'selected' : ''}>网格</option>
                    <option value="wide" ${layout === 'wide' ? 'selected' : ''}>宽屏双列</option>
                    <option value="single" ${layout === 'single' ? 'selected' : ''}>单列大图</option>
                </select></div>`;
                const imgList = mod.images || [];
                html += `<div class="list-divider"><span class="list-divider__label">图片列表 (${imgList.length})</span></div>`;
                html += `<div class="module-image-composer">
                    <input type="file" accept="image/*" multiple class="file-input" data-module-file="${index}">
                    <button class="btn btn--ghost btn--sm" data-module-upload="${index}" type="button">上传图片</button>
                    <textarea data-module-bulk="${index}" rows="3" placeholder="也可以粘贴图片链接，一行一个"></textarea>
                    <button class="btn btn--primary btn--sm" data-module-bulk-add="${index}" type="button">添加链接</button>
                </div>`;
                if (imgList.length === 0) {
                    html += '<p class="module-empty">还没有图片。上传本地图片，或把图片链接粘贴到上方输入框。</p>';
                }
                html += `<div class="module-images-list" data-module-images="${index}">
                    ${imgList.map((url, i) => `
                        <div class="module-image-item" data-img-index="${i}">
                            <span class="module-image-item__thumb">${url ? `<img src="${esc(url)}" onerror="this.style.display='none'">` : ''}</span>
                            <input type="text" data-img-url="${index}-${i}" value="${esc(url)}" placeholder="图片 URL">
                            <button class="btn--icon btn--icon--danger" data-remove-img="${index}-${i}" title="删除">×</button>
                        </div>
                    `).join('')}
                </div>`;
                html += `<button class="btn btn--ghost btn--sm" data-add-img="${index}">+ 添加图片</button>`;
            }
            return html;
        }
        return '<p class="module-item__hint">此模块内容在对应编辑区中管理，在此仅可调整顺序和开关显隐</p>';
    }

    function bindModuleEvents() {
        $$('[data-add-module]').forEach(btn => {
            btn.addEventListener('click', () => addModuleFromPreset(btn.dataset.addModule));
        });

        $$('.module-toggle-input').forEach(cb => {
            cb.addEventListener('change', () => {
                const idx = parseInt(cb.dataset.toggle);
                config.modules[idx].visible = cb.checked;
                autoSave();
            });
        });

        $$('[data-move-up]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.moveUp);
                if (idx > 0) { swapModules(idx, idx - 1); renderModules(); autoSave(); }
            });
        });

        $$('[data-move-down]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.moveDown);
                if (idx < config.modules.length - 1) { swapModules(idx, idx + 1); renderModules(); autoSave(); }
            });
        });

        $$('[data-remove-module]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.removeModule);
                if (confirm('确认删除此模块？')) {
                    config.modules.splice(idx, 1);
                    renderModules();
                    autoSave();
                }
            });
        });

        bindModuleFieldEvents();
    }

    function addModuleFromPreset(key) {
        const preset = MODULE_PRESETS.find(item => item.key === key);
        if (!preset) return;

        if (preset.singleton) {
            const existingIndex = config.modules.findIndex(mod => mod.type === preset.type);
            if (existingIndex >= 0) {
                config.modules[existingIndex].visible = true;
                expandedModuleIndex = existingIndex;
                renderModules();
                showToast('已定位到现有模块', 'success');
                autoSave();
                return;
            }
            config.modules.push({ type: preset.type, visible: true });
        } else if (typeof preset.create === 'function') {
            config.modules.push(preset.create());
        }

        expandedModuleIndex = config.modules.length - 1;
        renderModules();
        showToast('模块已添加，可直接编辑', 'success');
        autoSave();
    }

    function bindModuleFieldEvents() {
        $$('[data-module-label]').forEach(input => {
            input.addEventListener('change', () => {
                config.modules[parseInt(input.dataset.moduleLabel)].label = input.value;
                autoSave();
            });
        });
        $$('[data-module-nav]').forEach(cb => {
            cb.addEventListener('change', () => {
                config.modules[parseInt(cb.dataset.moduleNav)].nav = cb.checked;
                autoSave();
            });
        });
        $$('[data-module-content]').forEach(ta => {
            ta.addEventListener('change', () => {
                config.modules[parseInt(ta.dataset.moduleContent)].content = ta.value;
                autoSave();
            });
        });
        $$('[data-module-layout]').forEach(sel => {
            sel.addEventListener('change', () => {
                config.modules[parseInt(sel.dataset.moduleLayout)].layout = sel.value;
                autoSave();
            });
        });
        $$('[data-img-url]').forEach(input => {
            input.addEventListener('change', () => {
                const parts = input.dataset.imgUrl.split('-');
                const modIdx = parseInt(parts[0]), imgIdx = parseInt(parts[1]);
                if (config.modules[modIdx] && config.modules[modIdx].images) {
                    config.modules[modIdx].images[imgIdx] = input.value;
                    const thumb = input.closest('.module-image-item').querySelector('.module-image-item__thumb');
                    if (thumb) thumb.innerHTML = input.value ? `<img src="${esc(input.value)}" onerror="this.style.display='none'">` : '';
                    autoSave();
                }
            });
        });
        $$('[data-module-upload]').forEach(btn => {
            btn.addEventListener('click', () => {
                const fileInput = document.querySelector(`[data-module-file="${btn.dataset.moduleUpload}"]`);
                if (fileInput) fileInput.click();
            });
        });
        $$('[data-module-file]').forEach(input => {
            input.addEventListener('change', async () => {
                const idx = parseInt(input.dataset.moduleFile);
                const files = Array.from(input.files || []);
                if (files.length === 0) return;
                if (!config.modules[idx].images) config.modules[idx].images = [];
                const urls = [];
                for (const file of files) {
                    const url = await uploadImage(file);
                    if (url) urls.push(url);
                }
                if (urls.length > 0) {
                    config.modules[idx].images.push(...urls);
                    expandedModuleIndex = idx;
                    renderModules();
                    showToast(`已添加 ${urls.length} 张图片`, 'success');
                    autoSave();
                }
                input.value = '';
            });
        });
        $$('[data-module-bulk-add]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.moduleBulkAdd);
                const textarea = document.querySelector(`[data-module-bulk="${idx}"]`);
                const urls = textarea ? textarea.value.split('\n').map(u => u.trim()).filter(Boolean) : [];
                if (urls.length === 0) return;
                if (!config.modules[idx].images) config.modules[idx].images = [];
                config.modules[idx].images.push(...urls);
                expandedModuleIndex = idx;
                renderModules();
                showToast(`已添加 ${urls.length} 个链接`, 'success');
                autoSave();
            });
        });
        $$('[data-add-img]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.addImg);
                if (!config.modules[idx].images) config.modules[idx].images = [];
                config.modules[idx].images.push('');
                expandedModuleIndex = idx;
                renderModules();
                autoSave();
            });
        });
        $$('[data-remove-img]').forEach(btn => {
            btn.addEventListener('click', () => {
                const parts = btn.dataset.removeImg.split('-');
                const modIdx = parseInt(parts[0]), imgIdx = parseInt(parts[1]);
                if (config.modules[modIdx] && config.modules[modIdx].images) {
                    config.modules[modIdx].images.splice(imgIdx, 1);
                    expandedModuleIndex = modIdx;
                    renderModules();
                    autoSave();
                }
            });
        });
    }

    function swapModules(i, j) {
        const tmp = config.modules[i];
        config.modules[i] = config.modules[j];
        config.modules[j] = tmp;
    }

    // ---------- 主题管理 ----------

    function renderThemes() {
        $('#section-themes').innerHTML = `
            <div class="section-header">
                <h3 class="section-header__title">主题风格</h3>
                <p class="section-header__desc">导入自定义 HTML/CSS 主题包</p>
            </div>
            <div class="form-group">
                <label>当前主题</label>
                <div id="themeCurrent" style="font-size:0.88rem;color:var(--color-text-muted)">加载中...</div>
            </div>
            <div class="form-group">
                <label>上传主题</label>
                <div class="image-input">
                    <input type="file" id="themeFile" accept=".zip" class="file-input">
                    <button class="btn btn--ghost" id="btnThemeUpload">选择 .zip 文件</button>
                    <button class="btn btn--accent" id="btnThemeSubmit" disabled>上传</button>
                </div>
                <p style="font-size:0.75rem;color:var(--color-text-light);margin-top:0.4rem">
                    ZIP 内须包含 index.html（引用 /js/config.js）和/或 css/ 目录
                </p>
            </div>
            <div class="list-divider">
                <span class="list-divider__label">已安装主题</span>
            </div>
            <div id="themeList">加载中...</div>
        `;

        $('#btnThemeUpload').addEventListener('click', () => $('#themeFile').click());
        $('#themeFile').addEventListener('change', () => { $('#btnThemeSubmit').disabled = !$('#themeFile').files.length; });
        $('#btnThemeSubmit').addEventListener('click', uploadTheme);
        loadThemes();
    }

    async function loadThemes() {
        try {
            const res = await fetch('/api/themes');
            const data = await res.json();
            const active = data.active;

            $('#themeCurrent').innerHTML = active
                ? `<strong>${esc(active)}</strong> <button class="btn btn--ghost btn--sm" id="btnThemeReset" style="margin-left:0.5rem">重置为默认</button>`
                : '默认主题';
            if (active) $('#btnThemeReset').addEventListener('click', () => activateTheme('__default__'));

            const list = $('#themeList');
            if (data.themes.length === 0) {
                list.innerHTML = '<p style="color:var(--color-text-light);font-size:0.85rem">暂无已安装主题</p>';
                return;
            }

            list.innerHTML = data.themes.map(t => `
                <div class="list-item" style="align-items:center;gap:0.75rem">
                    <div style="flex:1;min-width:0">
                        <strong style="font-size:0.88rem">${esc(t.label || t.name)}</strong>
                        <span style="font-size:0.72rem;color:var(--color-text-light);margin-left:0.5rem">
                            ${t.hasHtml ? 'HTML' : ''} ${t.hasHtml && t.hasCss ? '+' : ''} ${t.hasCss ? 'CSS' : ''}
                            ${t.version ? ' v' + esc(t.version) : ''}
                        </span>
                        ${t.author ? `<span style="font-size:0.7rem;color:var(--color-text-muted);display:block;margin-top:0.15rem">${esc(t.author)}</span>` : ''}
                        ${t.description ? `<span style="font-size:0.72rem;color:var(--color-text-light);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px">${esc(t.description)}</span>` : ''}
                        ${active === t.name ? ' <span style="font-size:0.7rem;color:var(--color-accent)">(当前)</span>' : ''}
                    </div>
                    ${active !== t.name ? `<button class="btn btn--ghost btn--sm" data-activate="${esc(t.name)}">激活</button>` : ''}
                    <button class="btn--icon btn--icon--danger" data-delete-theme="${esc(t.name)}" title="删除">×</button>
                </div>
            `).join('');

            $$('[data-activate]').forEach(btn => btn.addEventListener('click', () => activateTheme(btn.dataset.activate)));
            $$('[data-delete-theme]').forEach(btn => btn.addEventListener('click', () => deleteTheme(btn.dataset.deleteTheme)));
        } catch (err) {
            $('#themeList').innerHTML = '<p style="color:var(--color-danger);font-size:0.85rem">加载失败</p>';
        }
    }

    async function uploadTheme() {
        const file = $('#themeFile').files[0];
        if (!file) return;
        const btn = $('#btnThemeSubmit');
        btn.disabled = true;
        btn.textContent = '上传中...';
        try {
            const formData = new FormData();
            formData.append('theme', file);
            const res = await fetch('/api/themes/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                showToast('主题上传成功: ' + data.name, 'success');
                $('#themeFile').value = '';
                loadThemes();
            } else {
                showToast(data.error || '上传失败', 'error');
            }
        } catch (err) {
            showToast('上传失败: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '上传';
        }
    }

    async function activateTheme(name) {
        try {
            const res = await fetch(`/api/themes/${encodeURIComponent(name)}/activate`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                // 同步本地 config，防止点"保存修改"时覆盖
                if (!config.theme) config.theme = {};
                config.theme.active = data.active;
                showToast(name === '__default__' ? '已重置为默认主题' : '已激活主题: ' + name, 'success');
                loadThemes();
            } else {
                showToast(data.error || '激活失败', 'error');
            }
        } catch (err) {
            showToast('激活失败: ' + err.message, 'error');
        }
    }

    async function deleteTheme(name) {
        if (!confirm(`确认删除主题 "${name}"？`)) return;
        try {
            const res = await fetch(`/api/themes/${encodeURIComponent(name)}`, { method: 'DELETE' });
            if (res.ok) {
                // 如果删除的是当前激活主题，同步本地 config
                if (config.theme && config.theme.active === name) {
                    config.theme.active = null;
                }
                showToast('主题已删除', 'success');
                loadThemes();
            } else {
                const data = await res.json();
                showToast(data.error || '删除失败', 'error');
            }
        } catch (err) {
            showToast('删除失败: ' + err.message, 'error');
        }
    }

    // ---------- 媒体库 ----------

    function renderMedia() {
        $('#section-media').innerHTML = `
            <div class="section-header">
                <h3 class="section-header__title">媒体库</h3>
                <p class="section-header__desc">已上传的图片资源</p>
            </div>
            <div class="media-grid" id="mediaGrid">
                <p style="color:var(--color-text-light);font-size:0.85rem">加载中...</p>
            </div>
        `;
        loadMedia();
    }

    async function loadMedia() {
        try {
            const res = await fetch('/api/images');
            const images = await res.json();
            const grid = $('#mediaGrid');

            if (images.length === 0) {
                grid.innerHTML = '<p style="color:var(--color-text-light);font-size:0.85rem">暂无上传图片</p>';
                return;
            }

            grid.innerHTML = images.map(img => `
                <div class="media-card">
                    <img class="media-card__img" src="${img.url}" alt="">
                    <div class="media-card__info">
                        <span class="media-card__name" title="${esc(img.filename)}">${esc(img.filename)}</span>
                        <button class="btn--icon btn--icon--danger btn--sm" data-delete-image="${esc(img.filename)}" title="删除">×</button>
                    </div>
                </div>
            `).join('');

            $$('[data-delete-image]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('确认删除此图片？')) return;
                    const res = await fetch(`/api/images/${encodeURIComponent(btn.dataset.deleteImage)}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast('图片已删除', 'success');
                        loadMedia();
                    } else {
                        showToast('删除失败', 'error');
                    }
                });
            });
        } catch (err) {
            $('#mediaGrid').innerHTML = '<p style="color:var(--color-danger);font-size:0.85rem">加载失败</p>';
        }
    }

    // ---------- 导出部署 ----------

    function renderExport() {
        $('#section-export').innerHTML = `
            <div class="section-header">
                <h3 class="section-header__title">导出部署</h3>
                <p class="section-header__desc">生成静态网站文件</p>
            </div>
            <div class="export-actions">
                <button class="btn btn--primary" id="btnExport">导出到 dist/</button>
                <button class="btn btn--accent" id="btnDownload">下载 ZIP</button>
            </div>
            <div class="export-log" id="exportLog">等待导出...</div>

            <div class="list-divider" style="margin-top:2rem">
                <span class="list-divider__label">配置管理</span>
            </div>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
                <button class="btn btn--ghost" id="btnExportConfig">📥 导出配置 JSON</button>
                <button class="btn btn--ghost" id="btnImportConfig">📤 导入旧版配置</button>
            </div>
            <p style="font-size:0.75rem;color:var(--color-text-light);margin-top:0.5rem">
                导入旧版 JSON 配置时会自动检测并迁移缺失字段（modules 数组等）
            </p>
            <input type="file" id="configFileInput" accept=".json" style="display:none">
            <div id="importResult" style="margin-top:0.5rem;font-size:0.82rem"></div>
        `;

        $('#btnExport').addEventListener('click', exportSite);
        $('#btnDownload').addEventListener('click', () => { window.location.href = '/api/export/download'; });
        $('#btnExportConfig').addEventListener('click', exportConfigFile);
        $('#btnImportConfig').addEventListener('click', () => $('#configFileInput').click());
        $('#configFileInput').addEventListener('change', importConfigFile);
    }

    function exportConfigFile() {
        const blob = new Blob([JSON.stringify(config, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('配置已导出', 'success');
    }

    async function importConfigFile() {
        const fileInput = $('#configFileInput');
        const file = fileInput.files[0];
        if (!file) return;
        const result = $('#importResult');

        if (!confirm('导入配置将覆盖当前所有数据。确认继续？')) {
            fileInput.value = '';
            return;
        }

        result.innerHTML = '<span style="color:var(--color-text-muted)">上传中...</span>';
        try {
            const formData = new FormData();
            formData.append('config', file);
            const res = await fetch('/api/config/import', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                result.innerHTML = '<span style="color:var(--color-success)">✅ ' + esc(data.message || '导入成功') + '</span>';
                showToast('配置导入成功，正在重新加载...', 'success');
                // 重新加载整个页面
                setTimeout(() => location.reload(), 1000);
            } else {
                result.innerHTML = '<span style="color:var(--color-danger)">❌ ' + esc(data.error || '导入失败') + '</span>';
                showToast(data.error || '导入失败', 'error');
            }
        } catch (err) {
            result.innerHTML = '<span style="color:var(--color-danger)">❌ 导入失败: ' + esc(err.message) + '</span>';
            showToast('导入失败: ' + err.message, 'error');
        }
        fileInput.value = '';
    }

    async function exportSite() {
        const btn = $('#btnExport');
        const log = $('#exportLog');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> 导出中...';
        log.innerHTML = '正在保存配置...\n';

        try {
            collectAll();
            await fetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            log.innerHTML += '<span class="log-success">配置已保存</span>\n正在导出静态文件...\n';

            const res = await fetch('/api/export', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                log.innerHTML += '<span class="log-success">导出成功！</span>\n';
                log.innerHTML += `输出目录: ${data.path}\n可直接部署到 Cloudflare Pages\n`;
                showToast('导出成功', 'success');
            } else {
                log.innerHTML += `<span class="log-error">导出失败: ${data.error}</span>\n`;
                showToast('导出失败', 'error');
            }
        } catch (err) {
            log.innerHTML += `<span class="log-error">错误: ${err.message}</span>\n`;
            showToast('导出失败', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '导出到 dist/';
        }
    }

    /* ===================================================================
       5. 事件绑定
       =================================================================== */

    function bindWorkItemEvents() {
        // 封面图片上传
        $$('.work-upload-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.closest('.work-item__body').querySelector('.work-file-input').click());
        });
        $$('.work-file-input').forEach(input => {
            input.addEventListener('change', async () => {
                const file = input.files[0];
                if (!file) return;
                const url = await uploadImage(file);
                if (url) {
                    const body = input.closest('.work-item__body');
                    body.querySelector('[data-field="image"]').value = url;
                    updatePreview(body.querySelector('.work-preview'), url);
                    autoSave();
                }
            });
        });

        // 封面图片 URL 变更
        $$('.work-item [data-field="image"]').forEach(input => {
            input.addEventListener('input', () => updatePreview(input.closest('.work-item__body').querySelector('.work-preview'), input.value));
        });

        // 图集添加面板
        $$('[data-add-gallery]').forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = document.querySelector(`[data-add-panel="${btn.dataset.addGallery}"]`);
                if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            });
        });
        $$('[data-panel-cancel]').forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = document.querySelector(`[data-add-panel="${btn.dataset.panelCancel}"]`);
                if (panel) {
                    panel.style.display = 'none';
                    panel.querySelector('textarea').value = '';
                }
            });
        });

        // 图集本地文件上传
        $$('[data-panel-upload]').forEach(btn => {
            btn.addEventListener('click', () => {
                const fileInput = document.querySelector(`[data-panel-file="${btn.dataset.panelUpload}"]`);
                if (fileInput) fileInput.click();
            });
        });
        $$('[data-panel-file]').forEach(input => {
            input.addEventListener('change', async () => {
                const files = Array.from(input.files);
                if (files.length === 0) return;
                const urls = [];
                for (const file of files) {
                    const url = await uploadImage(file);
                    if (url) urls.push(url);
                }
                if (urls.length > 0) {
                    appendGalleryImages(parseInt(input.dataset.panelFile), urls);
                    showToast(`已添加 ${urls.length} 张图片`, 'success');
                    autoSave();
                }
                input.value = '';
            });
        });

        // 图集在线链接添加
        $$('[data-panel-confirm]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.panelConfirm;
                const textarea = document.querySelector(`[data-panel-urls="${index}"]`);
                const urls = textarea.value.split('\n').filter(u => u.trim());
                if (urls.length === 0) return;
                appendGalleryImages(parseInt(index), urls);
                textarea.value = '';
                document.querySelector(`[data-add-panel="${index}"]`).style.display = 'none';
                showToast(`已添加 ${urls.length} 张图片`, 'success');
                autoSave();
            });
        });

        // 图集图片删除
        $$('[data-remove-gallery]').forEach(btn => {
            btn.addEventListener('click', () => {
                const workIndex = parseInt(btn.closest('.work-item').dataset.index);
                config.works.items[workIndex].images.splice(parseInt(btn.dataset.removeGallery), 1);
                btn.closest('.gallery-image-item').remove();
                reindexGalleryItems(workIndex);
                autoSave();
            });
        });

        // 图集图片 URL 变更
        $$('[data-gallery-url]').forEach(input => {
            input.addEventListener('change', () => {
                const workIndex = parseInt(input.closest('.work-item').dataset.index);
                const galleryIndex = parseInt(input.dataset.galleryUrl);
                if (config.works.items[workIndex].images) {
                    config.works.items[workIndex].images[galleryIndex] = input.value;
                }
                const preview = input.closest('.gallery-image-item').querySelector('img');
                if (preview) preview.src = input.value;
                autoSave();
            });
        });

        // 作品排序/删除
        $$('.work-item__actions .btn--icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = btn.closest('.work-item');
                const index = parseInt(item.dataset.index);
                const action = btn.dataset.action;

                if (action === 'remove') {
                    config.works.items.splice(index, 1);
                } else if (action === 'up' && index > 0) {
                    [config.works.items[index - 1], config.works.items[index]] = [config.works.items[index], config.works.items[index - 1]];
                } else if (action === 'down' && index < config.works.items.length - 1) {
                    [config.works.items[index], config.works.items[index + 1]] = [config.works.items[index + 1], config.works.items[index]];
                } else {
                    return;
                }
                renderWorks();
            });
        });
    }

    function bindGlobal() {
        // 保存按钮
        $('#btnSave').addEventListener('click', saveConfig);

        // 侧边栏导航
        $$('.sidebar__link').forEach(link => {
            link.addEventListener('click', () => {
                const section = link.dataset.section;
                if (!section) return;
                $$('.sidebar__link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                $$('.section-card').forEach(c => c.classList.remove('active'));
                const target = document.getElementById('section-' + section);
                if (target) target.classList.add('active');
                $('#topbarTitle').textContent = link.textContent;
                closeMobileSidebar();
            });
        });

        // 移动端菜单
        $('#mobileToggle').addEventListener('click', () => {
            $('#sidebar').classList.toggle('sidebar--open');
            $('#mobileToggle').classList.toggle('mobile-toggle--active');
        });

        document.addEventListener('click', (e) => {
            if (!$('#sidebar').contains(e.target) && !$('#mobileToggle').contains(e.target)) {
                closeMobileSidebar();
            }
        });
    }

    function closeMobileSidebar() {
        $('#sidebar').classList.remove('sidebar--open');
        $('#mobileToggle').classList.remove('mobile-toggle--active');
    }

    /* ===================================================================
       6. 数据收集
       =================================================================== */

    function collectAll() {
        // 摄影师信息
        config.photographer.name = val('#p-name');
        config.photographer.nameEn = val('#p-nameEn');
        config.photographer.tagline = val('#p-tagline');

        // 首页大图
        config.hero.image = val('#hero-image');
        config.hero.scrollHint = val('#hero-scroll');

        // 精选作品
        config.works.heading = val('#works-heading');
        config.works.items = [];
        $$('.work-item').forEach(el => {
            const images = [];
            el.querySelectorAll('[data-gallery-url]').forEach(input => {
                if (input.value.trim()) images.push(input.value.trim());
            });
            config.works.items.push({
                title: el.querySelector('[data-field="title"]').value,
                category: el.querySelector('[data-field="category"]').value,
                image: el.querySelector('[data-field="image"]').value,
                layout: el.querySelector('[data-field="layout"]').value,
                images
            });
        });

        // 关于我
        const aboutVisible = document.getElementById('about-visible');
        config.about.visible = aboutVisible ? aboutVisible.checked : true;
        config.about.role = val('#about-role');
        config.about.bio = [];
        $$('[data-bio-index]').forEach(el => config.about.bio.push(el.value));
        config.about.stats = [];
        $$('[data-stat-label]').forEach((el, i) => {
            config.about.stats.push({ label: el.value, value: document.querySelector(`[data-stat-value="${i}"]`).value });
        });
        config.aboutImage = val('#about-image');

        // 社交链接
        config.social.links = [];
        $$('[data-social-name]').forEach((el, i) => {
            config.social.links.push({ name: el.value, url: document.querySelector(`[data-social-url="${i}"]`).value });
        });

        // 版权信息
        config.footer.copyright = val('#footer-copy');

        collectModuleFields();
    }

    function collectModuleFields() {
        if (!config.modules || !Array.isArray(config.modules)) return;
        $$('.module-item').forEach(el => {
            const idx = parseInt(el.dataset.moduleIndex);
            const mod = config.modules[idx];
            if (!mod) return;

            const toggle = el.querySelector('.module-toggle-input');
            if (toggle) mod.visible = toggle.checked;

            const labelInput = el.querySelector(`[data-module-label="${idx}"]`);
            if (labelInput) mod.label = labelInput.value;

            const navInput = el.querySelector(`[data-module-nav="${idx}"]`);
            if (navInput) mod.nav = navInput.checked;

            const contentInput = el.querySelector(`[data-module-content="${idx}"]`);
            if (contentInput) mod.content = contentInput.value;

            const layoutInput = el.querySelector(`[data-module-layout="${idx}"]`);
            if (layoutInput) mod.layout = layoutInput.value;

            const imageInputs = el.querySelectorAll('[data-img-url]');
            if (imageInputs.length > 0) {
                mod.images = [];
                imageInputs.forEach(input => {
                    if (input.value.trim()) mod.images.push(input.value.trim());
                });
            }
        });
    }

    /* ===================================================================
       7. 工具函数
       =================================================================== */

    function val(sel) {
        const el = document.querySelector(sel);
        return el ? el.value : '';
    }

    function esc(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function previewImg(url) {
        return url ? `<img src="${esc(url)}" onerror="this.style.display='none'">` : '';
    }

    function showToast(message, type) {
        const container = $('#toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

})();
