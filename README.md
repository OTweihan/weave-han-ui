# WeaveHan Frontend

WeaveHan 博客系统前端项目，配套 WeaveHan 后端使用。

## 项目说明

- 项目名称：`weave-han`
- 技术栈：Vue 3 / TypeScript / Vite / Element Plus / Pinia / Vue Router
- 项目类型：前后端分离博客系统前端
- 仓库地址：<https://github.com/OTweihan/weave-han-ui>

## 项目背景

本项目基于 RuoYi Plus 前端体系进行定制开发，当前主要服务于个人博客系统与后台管理界面。

当前实现更关注：

- 博客内容管理
- 分类、标签、评论、草稿等博客业务模块
- 与自定义后端接口协同

## 目录结构

```text
weave-han-ui/
├── public/
├── src/
│   ├── api/
│   ├── components/
│   ├── layout/
│   ├── router/
│   ├── store/
│   ├── utils/
│   └── views/
└── vite.config.ts
```

当前 `src/views/blog` 下主要包含：

- `category`
- `comment`
- `config`
- `draft`
- `image`
- `like`
- `link`
- `page`
- `post`
- `tag`
- `visit`

## 环境要求

- Node.js 18+
- pnpm 或 npm

## 本地开发

### 安装依赖

```bash
pnpm install
```

如果你使用 npm，也可以：

```bash
npm install
```

### 启动开发环境

```bash
pnpm dev
```

### 构建生产包

```bash
pnpm build:prod
```

## 开发说明

- 当前 Vite 开发代理默认转发到：`http://localhost:8080`
- 接口模块主要位于 `src/api`
- 页面模块主要位于 `src/views`
- 组件与上传、编辑器、展示逻辑会持续按业务需求演进

## 关联仓库

- 后端仓库：<https://github.com/OTweihan/weave-han>

## 备注

这是个人长期维护项目，README 会随着项目演进持续更新。
