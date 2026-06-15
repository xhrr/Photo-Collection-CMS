# Photo Collection CMS

摄影师作品集 CMS — 本地运行，可视化编辑，一键导出静态网站。

## 功能

- **可视化编辑** — 管理后台编辑所有页面内容，无需手写代码
- **模块化布局** — 自由增删首页板块（文本/图片/作品集等），支持拖拽排序
- **图片上传** — 支持本地多图上传，自动存储到服务器
- **图集管理** — 每个作品支持多张图片，瀑布流展示，点击大图浏览
- **自定义主题** — 上传 ZIP 主题包替换页面样式，支持 `theme.json` 元数据
- **配置导入** — 支持导入旧版 JSON 配置，自动迁移字段
- **自动保存** — 图片上传、图集修改等操作自动保存
- **静态导出** — 一键导出纯静态网站，可直接部署到 Cloudflare Pages
- **ZIP 下载** — 导出后可下载 ZIP 压缩包

## 快速开始

### 安装

```bash
git clone https://github.com/xhrr/Photo-Collection-CMS.git
cd Photo-Collection-CMS
npm install
```

### 启动

```bash
npm start
```

启动后访问：

| 地址                          | 用途     |
| ----------------------------- | -------- |
| `http://localhost:3000`       | 前端预览 |
| `http://localhost:3000/admin` | 管理后台 |

### 导出部署

在管理后台点击 **导出部署** → **导出到 dist/**，然后将 `dist/` 目录部署到 Cloudflare Pages。

或点击 **下载 ZIP** 获取打包文件。

## 项目结构

```
photo/
├── server.js               # Express 服务器
├── package.json
├── data/
│   └── config.json         # 配置文件（所有可变内容）
├── site/                   # 前端模板
│   ├── index.html          # 首页（模块容器架构）
│   ├── gallery.html        # 图集页
│   ├── css/
│   │   ├── style.css       # 首页样式
│   │   └── gallery.css     # 图集页样式
│   ├── js/
│   │   ├── main.js         # 首页脚本（模块渲染引擎）
│   │   └── gallery.js      # 图集页脚本
│   ├── _headers
│   └── wrangler.toml
├── admin/                  # 管理后台
│   ├── index.html
│   ├── css/admin.css
│   └── js/admin.js
├── uploads/                # 上传的图片
├── themes/                 # 自定义主题
│   ├── theme-editorial/    # 杂志风格主题（含 theme.json）
│   └── README.md           # 主题开发文档
└── dist/                   # 导出的静态站点
```

## 模块系统

首页采用模块化架构，所有板块由 `config.json` 中的 `modules` 数组驱动渲染。

### 支持的模块类型

| 类型 | 说明 | 特有能力 |
|------|------|---------|
| `hero` | 首页大图 Banner | 全屏背景、视差滚动 |
| `works` | 精选作品网格 | 多布局模式 |
| `about` | 关于我 | 简介、数据亮点 |
| `text` | 自定义文本 | HTML 内容、导航栏链接 |
| `images` | 图片展示 | 网格/宽屏/单列三种布局 |
| `footer` | 页脚 | 社交链接、版权信息 |

### 模块管理

在管理后台的 **模块管理** 区可以：

- 调整模块顺序（上移/下移）
- 开关模块显隐
- 添加新模块（文本/图片）
- 删除自定义模块
- 文本模块支持 HTML 格式
- 图片模块支持多图上传和布局选择

## 配置说明

所有可变内容存储在 `data/config.json` 中，也可通过管理后台编辑：

```json
{
    "photographer": {
        "name": "中文名",
        "nameEn": "English Name",
        "tagline": "定位语"
    },
    "hero": {
        "image": "背景图 URL",
        "scrollHint": "滚动提示文字"
    },
    "works": {
        "heading": "区域标题",
        "items": [
            {
                "title": "作品标题",
                "category": "分类",
                "image": "封面图 URL",
                "layout": "featured | tall | default",
                "images": ["图1 URL", "图2 URL"]
            }
        ]
    },
    "about": {
        "visible": true,
        "role": "角色",
        "bio": ["段落1", "段落2"],
        "stats": [{ "label": "标签", "value": "数值" }]
    },
    "aboutImage": "肖像图 URL",
    "social": {
        "links": [{ "name": "平台名", "url": "链接" }]
    },
    "footer": {
        "copyright": "版权信息"
    },
    "theme": {
        "active": null
    },
    "modules": [
        { "type": "hero", "visible": true },
        { "type": "works", "visible": true },
        { "type": "about", "visible": false },
        { "type": "text", "visible": true, "label": "引言", "content": "<p>自定义内容</p>" },
        { "type": "images", "visible": true, "label": "作品欣赏", "images": [], "layout": "grid" },
        { "type": "footer", "visible": true }
    ]
}
```

### 传统版式格式

如果不提供 `modules` 字段，系统会自动从 `hero`、`works`、`about`、`footer` 字段生成。也支持通过管理后台 **导出部署** → **导入旧版配置** 自动迁移。

### 作品布局模式

| 模式       | 说明               |
| ---------- | ------------------ |
| `default`  | 普通网格           |
| `featured` | 通栏（占满整行）   |
| `tall`     | 双行高（适合竖图） |

## 配置导入

支持导入旧版 JSON 配置文件：

1. 在管理后台 **导出部署** → **配置管理**
2. 点击 **📥 导出配置 JSON** 备份当前配置
3. 点击 **📤 导入旧版配置** 上传旧 `.json` 文件
4. 系统自动检测并迁移缺失字段（`modules`、`theme` 等）
5. 导入成功后自动重新加载

## 自定义主题

主题为 ZIP 压缩包，结构如下：

```
my-theme.zip
├── index.html              # 自定义页面（需含 <div id="app">）
├── css/
│   └── style.css           # 自定义样式
└── theme.json              # 主题元数据（可选）
```

**theme.json 元数据格式：**
```json
{
    "name": "my-theme",
    "label": "我的主题",
    "description": "主题描述",
    "author": "作者名",
    "version": "1.0.0",
    "type": "full",
    "modules": ["hero", "works", "about", "text", "images", "footer"]
}
```

**HTML 模板要求：** 使用模块系统渲染，页面结构只需：

```html
<link rel="stylesheet" href="/css/style.css">
<!-- 导航栏（可选） -->
<nav class="nav" id="nav">
    <a href="#hero" class="nav__logo"></a>
    <ul class="nav__links" id="navLinks"></ul>
</nav>
<!-- 模块容器：所有板块由 JS 动态渲染 -->
<div id="app"></div>
<script src="/js/config.js"></script>
<script src="/js/main.js"></script>
```

在管理后台 → **主题风格** 中上传并激活。

详见 `themes/README.md` 主题开发文档。

## 图集管理

- 每个作品支持多张图片
- 支持本地多图批量上传
- 支持在线链接批量添加（换行分隔）
- 前端瀑布流布局展示
- 点击图片打开 Lightbox 大图浏览
- 左右箭头键/按钮切换图片

## 部署到 Cloudflare Pages

1. 在管理后台编辑内容并保存
2. 点击 **导出到 dist/**
3. 将 `dist/` 目录部署：
   - **方式一**：拖拽上传到 Cloudflare Dashboard
   - **方式二**：连接 Git 仓库，构建命令留空，输出目录设为 `dist`

## 技术栈

- **后端**：Node.js + Express
- **前端**：原生 HTML/CSS/JS（无框架）
- **图片上传**：Multer（支持多文件）
- **主题解压**：Adm-Zip
- **静态打包**：Archiver
- **配置迁移**：内置兼容旧版格式

## License

MIT
