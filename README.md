# SheetX 多维表格系统(Vue 3 + NestJS + PostgreSQL)

代码骨架，包含：

- **前端**：Vue 3 + Vite + TypeScript + Pinia + Vue Router + primevue
- **后端**：NestJS + Prisma + PostgreSQL + JWT 登录
- **数据模型**：Workspace / Base / Table / Field / View / Record（Record.data 使用 JSONB）

> 目标：先跑起来（可创建表、字段、记录，前端动态渲染表格并支持单元格编辑），再逐步增强筛选排序、协作、公式等。

---

## 1. 快速启动（推荐用 Docker 跑 PG）

### 1) 启动 PostgreSQL

在项目根目录执行：

```bash
启动：docker compose up -d
仅停止容器：docker compose stop
停止并移除容器：docker compose down
```

### 2) 启动后端

```bash
cd backend
cp .env.example .env
npm i
npx prisma migrate dev --name init
npm run start:dev
```

后端默认：`http://localhost:3000`

### 3) 启动前端

```bash
cd ../frontend
npm i
npm run dev
```

前端默认：`http://localhost:5173`

---

## 2. 账号与流程（

1) 打开前端 -> 注册 / 登录（JWT）
2) 创建 Workspace
3) 在 Workspace 里创建 Base
4) 在 Base 里创建 Table
5) 在 Table 里创建 Field
6) 在 Table 页面新增 Record，并编辑单元格

---

## 3. 目录结构

sheet-x/
docker-compose.yml
backend/   # NestJS + Prisma
frontend/  # Vue3

---

## 4. TODOLIST

- View：保存筛选/排序/分组，并将查询条件下推到后端
- RBAC：Base/Table/View 级别权限
- 评论/@/通知：对接 钉钉/飞书/企业微信等
- 关联字段：Link + 反向引用维护
- AI 自动化测试 参考：https://midscenejs.com/zh/quick-experience.html