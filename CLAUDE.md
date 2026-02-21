# Overtone — Adrian's Digital Garden

## 项目概述
个人博客网站，三个内容领域：Performance Engineering、Classical Records、AI Thoughts。
技术栈：Astro + TypeScript + Tailwind CSS，部署到 Cloudflare Pages。

## 设计参考
设计稿在 `docs/design/` 目录，共 7 页 PNG。请严格参照设计稿的视觉风格：
- 白色背景，大量留白，干净简约
- 手写体标题字体：Google Fonts "Caveat"（700 weight）
- 正文字体：Google Fonts "Noto Serif"（400/700）
- 三个分类的配色：
  - Performance Engineering: #DBEAFE (浅蓝背景) / #3B82F6 (蓝色图标)
  - Classical Records: #FEF3C7 (浅金背景) / #F59E0B (金色图标)
  - AI Thoughts: #F3E8FF (浅紫背景) / #A855F7 (紫色图标)
- 卡片样式：圆角 (rounded-xl)，细边框 (border border-gray-200)，悬停阴影
- Featured 标签：浅黄底色 #FEF9C3，圆角小标签

## 内容结构
文章使用 Astro Content Collections，Markdown 格式：
- `src/content/performance/` — 性能工程文章
- `src/content/classical/` — 古典音乐评论
- `src/content/ai/` — AI 思考文章

Frontmatter schema:
```yaml
title: string
description: string
date: YYYY-MM-DD
featured: boolean
tags: string[]
```

## Markdown 写作规范
- **加粗文本中禁止使用全角括号**：`**「术语」（Term）**` 会导致解析器输出原始星号，必须改用半角括号：`**「术语」(Term)**`

## 代码规范
- 严格 TypeScript，不使用 any
- 组件使用 .astro 文件，需要客户端交互时用 React islands
- Tailwind CSS，不写自定义 CSS（除非 Tailwind 无法实现）
- 所有文本内容支持中英文（预留 i18n 可能性）

## 常用命令
- `pnpm dev` — 启动开发服务器
- `pnpm build` — 构建生产版本
- `pnpm preview` — 预览构建结果
- `pnpm astro add` — 添加 Astro 集成
