# 技术指导文档站点

基于 [Docusaurus 3](https://docusaurus.io/zh-CN/) 构建的技术文档站点，部署到 GitHub Pages。

## 目录

- [快速开始](#快速开始)
- [常用命令](#常用命令)
- [撰写文档](#撰写文档)
- [新增侧边栏菜单](#新增侧边栏菜单)
- [顶部导航栏配置](#顶部导航栏配置)
- [静态资源与图片](#静态资源与图片)
- [多版本管理](#多版本管理)
- [构建与部署](#构建与部署)
- [常见问题](#常见问题)

## 快速开始

```bash
# 1. 安装依赖（Node.js >= 18）
npm install

# 2. 启动本地开发服务器（http://localhost:3000/learn-ai/）
npm start
```

开发服务器支持热更新，修改内容保存后浏览器自动刷新。

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm start` | 启动开发服务器（默认 3000 端口） |
| `npm start -- --port 8080` | 指定端口启动 |
| `npm run build` | 构建生产版本到 `build/` 目录 |
| `npm run serve` | 本地预览构建产物 |
| `npm run clear` | 清除构建缓存（页面显示异常时先试这个） |
| `npm run write-translations` | 生成翻译文件 |

## 撰写文档

所有文档放在 `docs/` 目录下，使用 Markdown / MDX 编写。

### 新增一篇文章

```
\---
title: 文章标题
sidebar_position: 4
---

# 正文开始...

支持所有标准 Markdown 语法。

## 二级标题

代码块示例：

​```bash
npm install
​```
```

**Front matter 常用字段：**

| 字段 | 说明 |
|---|---|
| `title` | 页面标题和侧边栏名称（优先级最高） |
| `sidebar_position` | 侧边栏排序，数字越小越靠前 |
| `sidebar_label` | 侧边栏显示名（可与页面标题不同） |
| `hide_title: true` | 隐藏页顶大标题 |
| `draft: true` | 草稿模式，开发服务器可见，构建时排除 |
| `tags: [tag1, tag2]` | 标签 |

> 标题优先级：`front matter title` > 正文第一个 `# 标题` > 文件名

### 使用 MDX 增强页面

扩展名为 `.mdx` 的文件可嵌入 React 组件和交互元素：

```mdx
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="npm" label="npm">npm install</TabItem>
  <TabItem value="yarn" label="yarn">yarn add</TabItem>
</Tabs>
```

## 新增侧边栏菜单

侧边栏为自动生成模式（见 `sidebars.ts`），无需手动配置。

### 一级菜单（分组）

新建目录 + `_category_.json`：

```
docs/cases/
├── _category_.json
├── index.md
└── demo.md
```

```json
{
  "label": "实战案例",
  "position": 4,
  "link": { "type": "doc", "id": "cases/index" }
}
```

- `label`：分组显示名称（没有此文件时显示目录名）
- `position`：分组排序
- `link`：点击分组名时跳转的目标页面

### 二级菜单（文章）

在分组目录下新建 `.md` 文件即可，名称取自 front matter 的 `title` 或正文第一个标题。

### 多级嵌套

直接在分组目录下再建子目录（各配 `_category_.json`），侧边栏自动生成多级结构。

## 顶部导航栏配置

编辑 `docusaurus.config.ts` 中的 `themeConfig.navbar`：

```ts
navbar: {
  title: '技术指南',
  logo: { alt: 'Logo', src: 'img/logo.svg' },
  items: [
    // 侧边栏入口
    { type: 'docSidebar', sidebarId: 'tutorialSidebar', label: '教程', position: 'left' },
    // 站内链接
    { to: '/cases', label: '案例', position: 'left' },
    // 外部链接
    { href: 'https://github.com/sprong666/learn-ai', label: 'GitHub', position: 'right' },
    // 下拉菜单
    {
      type: 'dropdown',
      label: '资源',
      position: 'right',
      items: [
        { href: 'https://...', label: '官方文档' },
      ],
    },
  ],
},
```

## 静态资源与图片

静态文件统一放在 `static/` 目录，站点内通过 baseUrl 前缀访问（本站为 `/learn-ai/`）。

```
static/
└── img/
    ├── logo.svg
    └── screenshots/
```

**在文章中引用图片：**

```markdown
![截图说明](/learn-ai/img/screenshots/demo.png)
```

> ⚠️ 注意路径需带 `/learn-ai/` 前缀（即 baseUrl），否则部署后图片会 404。

**站点 logo / 社交卡片图**（在 `docusaurus.config.ts` 中引用）：

- 导航栏 logo：`static/img/logo.svg`
- 社交分享图：`static/img/docusaurus-social-card.jpg`

## 多版本管理

### 发布一个版本

```bash
# 把当前 docs/ 冻结为 3.0 版本
npm run docusaurus docs:version 3.0
```

执行后自动生成：

```
versions.json                    # 版本清单
versioned_docs/version-3.0/     # 文档快照
versioned_sidebars/version-3.0/ # 侧边栏快照
```

### 版本目录结构

| 目录 | 含义 |
|---|---|
| `docs/` | 下一版（开发中，unstable） |
| `versioned_docs/version-3.0/` | 已发布的 v3.0 |
| 访问路径 | `当前版: /docs/...`，`v3.0: /docs/3.0/...` |

### 维护规则

- **新功能** → 只改 `docs/`（进下一版）
- **修旧版 bug** → 改 `versioned_docs/version-3.0/` 对应文件
- **删除旧版本** → `npm run docusaurus docs:remove-version 2.0`

### 版本横幅配置（可选）

```ts
// docusaurus.config.ts
presets: [['classic', {
  docs: {
    lastVersion: 'current',
    versions: {
      current: { label: '开发版', banner: 'unreleased' },
      '3.0':   { banner: 'none' },
      '2.0':   { banner: 'maintenance' },
    },
  },
}]],
```

## 构建与部署

```bash
# 本地验证构建是否通过
npm run build
npm run serve   # 预览 build/ 目录

# 部署：push 到 main 分支后 GitHub Actions 自动执行
git add .
git commit -m "docs: 更新内容"
git push
```

## 常见问题

<details>
<summary><b>图片 / logo 显示不出来？</b></summary>

检查两点：
1. 文件必须放在 `static/img/` 下（配置中的 `img/logo.svg` 是相对 `static/` 的路径）
2. 文章中引用图片路径要带 baseUrl 前缀 `/learn-ai/img/xxx.png`
</details>

<details>
<summary><b>页面报错或内容不更新？</b></summary>

先清缓存重启：

```bash
npm run clear
npm start
```
</details>

<details>
<summary><b>侧边栏没有显示新文章？</b></summary>

检查：
1. 文件是否在 `docs/` 目录下
2. front matter 格式是否正确（`---` 包裹的 YAML）
3. MDX 文件中的特殊字符（如 `{`、`<`）是否被正确转义
</details>

<details>
<summary><b>构建时报 MDX 语法错误？</b></summary>

`.md` 文件也会走 MDX 编译，正文中的 `<`、`{`、`×` 等需转义，或用代码块包裹。不想受 MDX 约束时在 front matter 加：

```yaml
\---
parse_number_prefixes: false
markdown_strict: true
---
```
</details>
