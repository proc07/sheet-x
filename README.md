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
pnpm install
pnpm --filter sheet-x-backend prisma:migrate
pnpm --filter sheet-x-backend dev
```

后端默认：`http://localhost:3000`

### 3) 启动前端

```bash
pnpm --filter sheet-x-web dev
```

前端默认：`http://localhost:5173`

### 一键同时启动前后端（推荐）

```bash
pnpm dev
```

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

apps/
  web/     # Nuxt Dashboard（Nuxt 4 + @nuxt/ui）
  old-web/ # 旧版 Vue 3 + Vite（历史保留）
  server/  # NestJS + Prisma
packages/
  shared/  # 共享包（types/constants/utils/interfaces/enums）

---

## 4. TODOLIST

- View：保存筛选/排序/分组，并将查询条件下推到后端
- RBAC：Base/Table/View 级别权限
- 表格字段支持：
  - 基础
    - [x]文本
    - [x]单选
    - [x]多选
    - []人员
    - [x]日期
    - [x]文件
    - [x]数字
    - [x]复选框
    - [x]链接
    - []公式
    - []查找引用
  - 业务
    - []流程
    - []按钮
    - []自动编号
    - []电话号码
    - []Email
    - []地理位置
    - []条码
    - []进度
    - []货币
    - []评分
  - 高级
  - 
- workspace: 工作空间管理
  - 管理用户
    - 邀请用户：发送邀请链接，用户点击后注册并加入工作空间
    - 删除用户：从工作空间中移除用户
    - 更新用户权限：管理员可以更新用户在工作空间中的权限（读/写/删/建）
      - 字段可见：可以设置哪些字段对其他用户可见，哪些字段对其他用户不可见
      - 删除记录：（可以选择以下）
        - 1. 用户可删除自己创建的记录。
        - 2. 可删除其他用户的记录（管理员可以删除任意用户的记录）。
        - 3. 不可删除
  - 删除工作空间、更新工作空间信息

- 协同: 实时看到多个用户之间的操作（某个用户在某个表格上进行了操作，其他用户能实时看到，但是不能操作）

- 评论/@/通知：对接 钉钉/飞书/企业微信等
- 关联字段：Link + 反向引用维护
- AI 自动化测试 参考：https://midscenejs.com/zh/quick-experience.html
