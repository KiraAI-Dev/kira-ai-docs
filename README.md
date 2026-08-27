# KiraAI 文档

This is the official documentation repo of KiraAI based on VitePress

## Introduction

KiraAI 是一个模块化、跨平台的 AI 数字生命平台，以数字生命为中心，连接大语言模型与多种聊天平台。

## Features

- 🚀 占用资源少，部署成本低
- 🧩 支持丰富的插件扩展，轻松定制功能
- 🐳 多种部署方式，一键启动
- 🔒 提供完善的安全机制，保障数据隐私
- 🌐 支持 Windows、Linux、Docker 等多平台部署
- 📚 详细的开发文档和示例，上手容易

## Installation

```bash
# 使用 npm
npm install

# 使用 pnpm
pnpm install

# 使用 yarn
yarn install
```

## Development

### 启动开发服务器

```bash
# 使用 npm
npm run dev

# 使用 pnpm
pnpm run dev

# 使用 yarn
yarn dev
```

开发服务器将在 `http://localhost:5173` 启动（端口可能会根据可用性自动调整）。

### 构建文档

```bash
# 使用 npm
npm run build

# 使用 pnpm
pnpm run build

# 使用 yarn
yarn build
```

构建后的文件将输出到 `.vitepress/dist` 目录。

### 预览构建结果

```bash
# 使用 npm
npm run serve

# 使用 pnpm
pnpm run serve

# 使用 yarn
yarn serve
```

## 项目结构

```
.
├── docs/                    # 文档源码目录
│   ├── .vitepress/         # VitePress 配置目录
│   │   ├── config.ts       # 主配置文件
│   │   ├── theme/          # 主题配置
│   │   └── dist/           # 构建输出目录
│   ├── zh/                 # 中文文档目录
│   │   ├── guide/          # 指南文档
│   │   ├── deployment/     # 部署文档
│   │   ├── development/    # 开发文档
│   │   └── ...             # 其他文档目录
│   ├── en/                 # 英文文档目录
│   │   ├── guide/          # 指南文档
│   │   ├── deployment/     # 部署文档
│   │   ├── development/    # 开发文档
│   │   └── ...             # 其他文档目录
│   └── index.md            # 首页文档
├── package.json            # 项目配置
├── .gitignore              # Git 忽略文件
└── README.md               # 项目说明
```

## 多语言支持

本项目支持中英文双语言：

- 中文文档：`docs/zh/`
- 英文文档：`docs/`

## 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 许可证

本项目采用 AGPL 3.0 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系我们

- GitHub: [KiraAI-Dev/KiraAI](https://github.com/KiraAI-Dev/KiraAI)
- 官方文档：[KiraAI 文档](https://docs.kira-ai.top)
