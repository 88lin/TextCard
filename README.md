<div align="center">

# TextCard Studio - 小红书文字卡片生成器

**🎯 面向小红书创作者的 Markdown + AI智能排版的文字卡片工具**

把长文、笔记、教程、观点稿和选题灵感，快速变成适合小红书发布的 3:4 系列文字卡片。

[![GitHub Stars](https://img.shields.io/github/stars/88lin/TextCard-Studio?style=social)](https://github.com/88lin/TextCard-Studio)
[![Static Site](https://img.shields.io/badge/Type-Static%20Site-success.svg)]()
[![Canvas Render](https://img.shields.io/badge/Render-Canvas-ff69b4.svg)]()
[![OpenAI Compatible](https://img.shields.io/badge/AI-OpenAI%20Compatible-10a37f.svg)]()

🌐 [在线体验](https://88lin.github.io/TextCard-Studio/) | 🚀 [打开编辑器](https://88lin.github.io/TextCard-Studio/editor.html) | 📖 [使用指南](https://88lin.github.io/TextCard-Studio/guide.html)

</div>

---

## 项目简介

TextCard Studio 是一款纯前端的小红书文字卡片生成器。你可以输入 Markdown，也可以粘贴一段没有格式的纯文本，让 AI 自动整理成结构清晰的卡片文案，再选择模板实时预览并导出高清图片。

核心流程都在浏览器本地完成：Markdown 解析、智能分页、Canvas 排版、预览生成、单张下载和批量打包。AI 功能支持自定义 OpenAI 兼容接口，适合内容创作者、知识博主、公众号作者、运营同学和需要快速生成图文卡片的个人项目使用。

## 效果预览

<div align="center">

![TextCard Studio 演示](assets/readme/demo.png)

*输入文字，选择模板，实时预览，一键导出。*

</div>

## 核心特性

| 能力 | 说明 |
|:--|:--|
| 📝 Markdown 转图片 | 支持标题、加粗、高亮、引用、列表、行内代码、图片和强制分页 |
| 🤖 AI 智能排版 | 把无格式纯文本整理成小红书风格 Markdown，自动加标题、分层级、加粗重点 |
| ✍️ 写作助手预设 | 输入一个主题，生成带表情、段落结构和配图建议的小红书帖子草稿 |
| ⚙️ 自定义 AI 接口 | 支持 OpenAI 兼容接口，可自定义接口地址、API Key、模型和提示词 |
| 🧩 提示词预设 | 内置“AI 智能排版”“写作助手”“自定义”，提示词可直接编辑并保存到本地 |
| ⚡ 语法速查插入 | 点击语法速查按钮，可一键插入 `#`、`##`、加粗、高亮、引用、列表等 Markdown 片段 |
| 📄 智能分页 | 根据模板内容区域自动拆分为多张 3:4 卡片，支持 `---` 手动分页 |
| 🎨 模板系统 | 内置多款适合小红书图文发布的模板，支持封面、水印、签名和社交图标 |
| 🖋️ 增强 Canvas 排版 | 优化中文避头尾标点、英文单词不断行，让中英文混排更自然 |
| 📦 高清导出 | 输出 1242 x 1656 图片，支持单张下载和批量打包 ZIP |
| 🔒 本地优先 | 基础编辑、预览、分页和导出都在浏览器本地完成，不依赖后端 |

## AI 功能

### AI 智能排版

适合把一段乱糟糟的文字整理成可直接出图的 Markdown：

```text
没有格式的纯文本
↓
# 短标题

## 小节标题

**重点词** + 清晰段落 + 合理列表
```

特点：

- 默认模型为 `gpt-5.5`
- 支持自定义模型名称和 OpenAI 兼容接口
- 支持撤销，AI 排版后可一键恢复原文
- 自动过滤容易造成空白页的分割线输出
- 控制标题长度，减少标题撑成 2 到 3 行的情况

### 写作助手

适合从一个选题生成小红书帖子草稿。

使用方式：

1. 打开 AI 设置。
2. 将“提示词预设”切换为“写作助手”。
3. 在左侧输入框填写主题，例如 `上海周末咖啡店推荐`。
4. 点击“AI 写作助手”。

说明：写作助手预设里的“我给出的主题是：”后面的内容，来自左侧输入框；提示词框只用于编辑 AI 指令模板。

### 自定义提示词

你可以直接改提示词框内容。手动修改后，预设会自动切换为“自定义”，按钮文案也会变成“AI 自定义生成”。

适合这些场景：

- 固定自己的小红书爆款结构
- 让 AI 保持更克制的排版风格
- 改成公众号、朋友圈、课程卡片等其他文案结构
- 接入第三方 OpenAI-compatible 网关或代理接口

## 模板预览

<div align="center">

| <img src="assets/readme/cover_1.png" width="175" alt="苹果备忘录封面模板"><img src="assets/readme/page_1.png" width="175" alt="苹果备忘录内容模板"> | <img src="assets/readme/cover_2.png" width="175" alt="苏黎世工作室封面模板"><img src="assets/readme/page_2.png" width="175" alt="苏黎世工作室内容模板"> |
|:--:|:--:|
| 苹果备忘录 | 苏黎世工作室 |

| <img src="assets/readme/cover_3.png" width="175" alt="极简杂志封面模板"><img src="assets/readme/page_3.png" width="175" alt="极简杂志内容模板"> | <img src="assets/readme/cover_4.png" width="175" alt="弥散极光封面模板"><img src="assets/readme/page_4.png" width="175" alt="弥散极光内容模板"> |
|:--:|:--:|
| 极简杂志 | 弥散极光 |

| <img src="assets/readme/cover_5.png" width="175" alt="暗夜深思封面模板"><img src="assets/readme/page_5.png" width="175" alt="暗夜深思内容模板"> | <img src="assets/readme/cover_6.png" width="175" alt="大厂文档封面模板"><img src="assets/readme/page_6.png" width="175" alt="大厂文档内容模板"> |
|:--:|:--:|
| 暗夜深思 | 大厂文档 |

</div>

## 快速开始

### 在线使用

直接访问：

- 首页：<https://88lin.github.io/TextCard-Studio/>
- 编辑器：<https://88lin.github.io/TextCard-Studio/editor.html>
- 使用指南：<https://88lin.github.io/TextCard-Studio/guide.html>

### 本地运行

```bash
git clone https://github.com/88lin/TextCard-Studio.git
cd TextCard-Studio

python -m http.server 8000
```

然后在浏览器打开：

```text
http://localhost:8000/editor.html
```

不建议直接双击 `editor.html` 打开，因为默认文本、模板和部分资源需要通过 HTTP 方式加载。

### 一键部署

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/88lin/TextCard-Studio)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/88lin/TextCard-Studio)

## Markdown 写法

编辑器内置语法速查按钮，点击对应语法即可插入到输入框。

| 写法 | 效果 |
|:--|:--|
| `# 一级标题` | 大标题 |
| `## 二级标题` | 小节标题 |
| `**重点内容**` | 加粗强调 |
| `==高亮内容==` | 高亮标记 |
| `> 引用内容` | 引用块 |
| `` `行内代码` `` | 行内代码 |
| `- 列表项` | 无序列表 |
| `1. 列表项` | 有序列表 |
| `![描述](链接)` | 插入图片 |
| `::: center ... :::` | 居中段落 |
| `---` | 强制分页 |

更多示例见：[排版示例](https://88lin.github.io/TextCard-Studio/format-demo.html)。

## 项目结构

```text
TextCard-Studio/
├── index.html              # 首页
├── editor.html             # 在线编辑器
├── guide.html              # 使用指南
├── format-demo.html        # 排版示例
├── css/                    # 页面样式、布局和组件样式
├── js/                     # AI、分页、Canvas 渲染、导出与编辑器逻辑
├── templates/              # 模板配置
├── assets/                 # 图标、模板图和 README 资源
└── data/                   # 默认文本内容
```

## 开发说明

项目是静态前端结构，无需安装 npm 依赖。主要模块：

- `js/App.js`：应用入口、状态调度、AI 设置和编辑器交互
- `js/AIFormatter.js`：OpenAI 兼容接口请求、提示词预设和 Markdown 结果解析
- `js/TextSplitter.js`：Markdown 文本分页
- `js/utils/canvas-text-engine.js`：Canvas 文本布局、中文避头尾和英文单词换行控制
- `js/CanvasRenderer.js`：Canvas 绘制
- `js/PreviewGenerator.js`：预览生成
- `js/DownloadManager.js`：图片导出和打包下载
- `js/TemplateManager.js`：模板加载
- `js/TemplateDefinitions.js`：模板绘制逻辑

新增模板通常需要：

1. 在 `templates/` 新建模板 JSON。
2. 在 `templates/index.json` 注册模板。
3. 如需特殊视觉效果，在 `js/TemplateDefinitions.js` 增加绘制逻辑。
4. 打开 `editor.html` 验证模板预览和导出效果。

## 隐私说明

TextCard Studio 的基础编辑、分页、预览和导出流程均在浏览器本地完成。正文内容不会因为生成图片而上传到服务器。

使用 AI 功能时，浏览器会把当前输入框中的内容发送到你配置的 OpenAI 兼容接口。接口地址、模型、API Key 和自定义提示词保存在本地浏览器的 LocalStorage 中；请确认你的接口允许浏览器跨域请求，并自行评估密钥保存方式是否适合公开设备。

## 适合谁用

- 小红书图文创作者
- 知识博主和课程作者
- 公众号、朋友圈、社群运营
- 想把长文拆成卡片内容的人
- 需要本地生成高清文字图片的个人项目

---

<div align="center">

## ⭐ 如果这个项目对您有帮助，请点个 Star 支持一下！

**让更多人看到这款小红书文字卡片生成器**

[![Star History Chart](https://api.star-history.com/svg?repos=88lin/TextCard-Studio&type=Date)](https://star-history.com/#88lin/TextCard-Studio&Date)

---

**TextCard Studio - 小红书文字卡片生成器 | 开源免费的 Markdown 转图片工具**

*释放文字的力量，让排版不再成为负担*

</div>
