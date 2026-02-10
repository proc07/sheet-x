# Monorepo 目录结构与职责

## 目录结构

```
apps/
  web/        # Nuxt Dashboard（Nuxt 4 + @nuxt/ui）应用
  old-web/    # 旧版 Vue3 + Vite 前端（历史保留）
  server/     # NestJS + Prisma 后端 API 服务
packages/
  shared/     # 单一共享包（types/constants/utils/interfaces/enums）
```

## 子包职责

### sheet-x-web（apps/web）
- Nuxt 应用（含 SSR/Node Nitro 构建产物）
- 主要脚本：dev / build / typecheck
- 构建输出：`.output/`（Nitro）与 `.nuxt/`（生成/缓存）

### sheet-x-frontend（apps/old-web）
- 旧版 Vue3 + Vite 应用（保留用于对照或逐步迁移）
- 主要脚本：dev / build / test / typecheck
- 构建输出：`dist/`

### sheet-x-backend（apps/server）
- NestJS API 服务（Prisma 连接 Postgres）
- 主要脚本：dev / build / test / typecheck / prisma:*
- 构建输出：`dist/`

### @sheet-x/shared（packages/shared）
- 统一共享包入口：types / constants / utils / interfaces / enums
- 被 apps/* 通过 `workspace:*` 形式依赖

## Turborepo 任务（根目录 turbo.json）
- dev：本地开发（不缓存、长驻）
- build：生产构建（缓存，输出包含 `dist/**`、`.output/**`、`.nuxt/**`）
- test：测试（依赖 build，不产物缓存）
- typecheck：类型检查（不产物缓存）

## 依赖关系
- 工作区依赖统一通过 `workspace:*` 引用内部包：
  - `apps/web` → `@sheet-x/shared`
  - `apps/server` → `@sheet-x/shared`
