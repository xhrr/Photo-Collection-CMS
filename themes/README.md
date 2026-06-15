# 主题系统

Photo Collection CMS 支持通过 ZIP 主题包自定义前端样式与页面结构。

## 使用方式

### 上传主题

1. 将主题打包为 `.zip` 文件
2. 进入管理后台 → **主题风格**
3. 点击「选择 .zip 文件」上传
4. 点击「激活」启用主题
5. 可随时点击「重置为默认」恢复默认主题

### 主题包结构

```
my-theme.zip
├── index.html              # 页面模板（可选，需含 <div id="app">）
├── css/
│   └── style.css           # 样式文件（可选）
└── theme.json              # 主题元数据（可选）
```

**最低要求**：ZIP 内须包含 `index.html` 或 `css/` 目录之一。

## 模块系统架构

CMS 使用模块化渲染引擎 `main.js`。首页不再使用固定 HTML 结构，而是通过 `config.json` 的 `modules` 数组动态渲染。

### HTML 模板要求

主题的 `index.html` 只需提供导航和模块容器：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>摄影师</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>

    <!-- 导航栏（必需，main.js 会动态填充链接） -->
    <nav class="nav" id="nav">
        <a href="#hero" class="nav__logo"></a>
        <button class="nav__toggle" id="navToggle" aria-label="菜单">
            <span></span><span></span><span></span>
        </button>
        <ul class="nav__links" id="navLinks"></ul>
    </nav>

    <!-- 模块容器：所有板块由 main.js 动态渲染到此处 -->
    <div id="app"></div>

    <!-- 必须引用的脚本 -->
    <script src="/js/config.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>
```

`<div id="app">` 是模块渲染的容器，所有板块（hero、works、about、text、images、footer）均由 `main.js` 动态生成。

### 主题 CSS 覆盖

主题的 `css/style.css` 会覆盖默认样式。建议在文件开头引用 `theme.json` 中定义的元数据。

### theme.json 元数据

主题可包含 `theme.json` 文件，提供描述信息显示在管理后台：

```json
{
    "name": "my-theme",
    "label": "我的主题",
    "description": "深色背景 + 金色点缀的杂志风格主题",
    "author": "作者名",
    "version": "1.0.0",
    "type": "full",
    "modules": ["hero", "works", "about", "text", "images", "footer"]
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 主题标识符，与文件夹名一致 |
| `label` | 否 | 显示名称（管理后台使用） |
| `description` | 否 | 主题描述 |
| `author` | 否 | 作者信息 |
| `version` | 否 | 版本号 |
| `type` | 否 | 主题类型（`full` 或 `css-only`） |
| `modules` | 否 | 支持的模块类型列表 |

## 模块类型参考

`main.js` 支持以下模块类型，主题 CSS 可针对各模块定制样式：

### hero — 首页大图

```css
/* 全屏 Banner，带视差滚动效果 */
.hero { height: 100vh; }
.hero__name { font-family: var(--font-serif); }
.hero__tagline { /* 定位语 */ }
.hero__scroll { /* 向下滚动提示 */ }
```

### works — 精选作品

作品网格，支持三种布局：

| CSS Class | 说明 |
|-----------|------|
| `.work-card--default` | 普通网格（4:5 比例） |
| `.work-card--featured` | 通栏（16:9 比例） |
| `.work-card--tall` | 双行高（适合竖图） |

### about — 关于我

含头像、简介、数据亮点。

### text — 自定义文本

```css
/* 文本模块渲染在 .text-module__content 中 */
.section--text .text-module__content { max-width: 720px; }
.text-module__content p { margin-bottom: 1.2rem; }
```

### images — 图片展示

支持三种布局：

| CSS Class | 说明 |
|-----------|------|
| `.images-module__grid--grid` | 自适应网格 |
| `.images-module__grid--wide` | 宽屏双列 |
| `.images-module__grid--single` | 单列大图 |

### footer — 页脚

社交链接 + 版权信息。

## 必需的 CSS Class

`main.js` 会动态添加以下 class 实现交互和动画：

| Class | 触发条件 |
|-------|----------|
| `.nav--visible` | 页面加载时立即添加 |
| `.nav--scrolled` | 滚动超过 80px |
| `.section__header--visible` | 进入视口时 |
| `.work-card--visible` | 进入视口时（支持延迟动画） |
| `.work-card--featured/tall/default` | 根据布局配置 |
| `.about-image--visible` | 进入视口时 |
| `.about-content--visible` | 进入视口时 |
| `.nav__links--open` | 移动端菜单打开 |
| `.nav__toggle--active` | 移动端菜单按钮激活 |

## 示例主题

### theme-editorial（杂志风格）

高端杂志风格主题，位于 `themes/theme-editorial/`：

- 深色背景 `#0a0a0a` + 金色点缀 `#c9a96e`
- 衬线字体（Playfair Display + Cormorant Garamond）
- 毛玻璃导航栏
- Hero 带 CTA 按钮和渐变背景
- 作品卡片悬浮缩放效果
- 全响应式适配

**配色方案：**
```css
--bg-primary: #0a0a0a;
--bg-secondary: #111111;
--text-primary: #ffffff;
--text-secondary: #999999;
--accent: #c9a96e;
--border: #1a1a1a;
```

## 主题开发建议

### 使用 CSS 变量覆盖默认样式

```css
:root {
    --color-bg: #0a0a0a;
    --color-text: #e8e8e8;
    --color-accent: #d4a853;
    --font-serif: 'Playfair Display', serif;
    --font-sans: 'Inter', sans-serif;
}
```

### 动画性能指南

| 场景 | 建议时长 | 缓动函数 |
|------|---------|---------|
| 悬停/点击反馈 | 0.2s - 0.3s | `ease` |
| 组件进入 | 0.4s - 0.6s | `ease-out` |
| 页面过渡 | 0.8s - 1.2s | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |

### 字体推荐

- **衬线**：Playfair Display、Cormorant Garamond、Noto Serif SC
- **无衬线**：Inter、Noto Sans SC、DM Sans

## 部署注意事项

主题文件会在导出时合并到 `dist/` 目录，覆盖默认站点文件：

```
dist/
├── index.html      # 主题的 HTML
├── css/
│   └── style.css   # 主题的 CSS
├── js/
│   ├── config.js   # 生成的配置
│   └── main.js     # 渲染引擎
└── uploads/        # 上传的图片
```
