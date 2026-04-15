# CLAUDE.md

此文件为 AI Coding 在本仓库中工作时提供指导。

## 项目概述

这是一个用于与 Gitea 实例交互的 CLI 工具。它使用 `alova`（一个请求库）根据 Gitea 的 OpenAPI 规范生成类型安全的 API 绑定。

## 命令

```bash
pnpm cli           # 直接运行 CLI（使用 tsx 执行 TypeScript）
pnpm build         # 构建发布版本（tsdown + chmod）
pnpm format        # 使用 Prettier 格式化代码
pnpm tsc           # 类型检查（不生成文件）
```

## 架构

```
src/
├── index.ts                    # CLI 入口（使用 commander）
└── gitea/
    ├── index.ts                # Gitea 类 - 主要 API 封装
    ├── config.ts               # 配置存储在 ~/.config/gitea-mcp/
    ├── api/
    │   ├── index.ts            # 默认导出的 alova Apis 实例
    │   ├── createApis.ts       # 创建类型化 API 代理的工厂函数
    │   ├── apiDefinitions.ts   # 根据 Gitea OpenAPI 规范自动生成
    │   └── globals.d.ts        # 为生成 API 提供的类型增强
    └── utils/
        └── encrypt.ts          # 简单的 token 加密工具
```

### API 生成

`src/gitea/api` 中的所有文件由 `alova` **自动生成**，请不要手动修改

### Gitea 类

`Gitea` 类（`src/gitea/index.ts`）在生成的 alova 绑定之上提供了更高层次的 API，包含：

- 配置加载和验证
- Host URL 规范化（添加 https://、尾部斜杠）
- 通过 `access_token` 参数进行 token 认证
- 常见操作的便捷方法（issues、PRs、repos、labels）

### 配置存储

凭证以加密形式存储在 `~/.config/gitea-mcp/config.json`。`src/gitea/config.ts` 中的 `saveConfig` 和 `loadConfig` 函数负责使用简单工具进行加解密。

## 注意

每次新增或修改代码，应按照以下步骤进行：

- 使用 `.agents/skills/code-simplifier` skill 对代码进行简化。
- 使用 `pnpm tsc` 和 `pnpm format` 对代码进行类型检查，确保符合项目的类型规范。
