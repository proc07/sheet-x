# 多维表格高级权限 API

## 认证
- 所有接口均需要 `Authorization: Bearer <token>`（除 `/auth/*`）

## 高级权限配置

### 获取 Base 高级权限配置（仅 OWNER / ADMIN）
- `GET /advanced-permissions/bases/:baseId`
- 响应（示例）
```json
{
  "enabled": false,
  "allowShareGrant": true,
  "updatedAt": "2026-02-02T08:47:04.000Z",
  "config": { "version": 1, "roles": [] },
  "members": [],
  "tables": []
}
```

### 保存 Base 高级权限配置（仅 OWNER / ADMIN）
- `PUT /advanced-permissions/bases/:baseId`
- 请求体
```json
{
  "enabled": true,
  "allowShareGrant": true,
  "config": { "version": 1, "roles": [] }
}
```
- 说明
  - 系统角色必须存在：`owner/admin/editor/viewer`
  - `owner/admin` 为锁定系统角色，权限会被服务端强制回写为全量权限（不可修改）
  - 详细权限不能超过数据表权限；非法配置会返回 400
  - 保存后会写入审计日志：`ADVANCED_PERMISSION_UPDATE`

### 获取当前用户在某表的有效权限
- `GET /advanced-permissions/tables/:tableId/me`
- 响应（示例）
```json
{
  "enabled": true,
  "role": { "id": "system_editor", "type": "system", "key": "editor", "name": "编辑者" },
  "tablePermission": "EDIT",
  "record": { "canCreate": true, "canDelete": true, "editScope": { "type": "ALL" }, "readScope": { "type": "ALL" } },
  "fields": { "mode": "ALL", "permsByFieldId": {} },
  "views": { "canManage": true, "visible": { "mode": "ALL", "viewIds": [] } },
  "dashboard": { "permission": "READ" },
  "automation": { "permission": "NONE" },
  "other": { "allowCopy": true, "allowDuplicate": true, "allowDownload": true, "allowPrint": true }
}
```

## 数据访问控制（生效点）
- `GET /tables?baseId=...`：过滤无权限（NONE）的表
- `GET /fields?tableId=...`：过滤不可读字段
- `GET /records?tableId=...`：按可读范围过滤记录，并剔除不可读字段数据
- `POST /records` / `PATCH /records/:recordId` / `DELETE /records/:recordId`：按记录范围与字段级权限拦截
- `GET /views?tableId=...`：按可见性过滤视图
- `POST /views`：需要具备视图管理权限

## Workspace 成员管理

### 列出成员（workspace member 可用）
- `GET /workspaces/:workspaceId/members`

### 按邮箱添加/更新成员（仅 OWNER / ADMIN）
- `POST /workspaces/:workspaceId/members`
- 请求体
```json
{ "email": "user@example.com", "role": "VIEWER" }
```
- 说明
  - 被添加用户必须已存在（已注册）
  - role 支持：OWNER / ADMIN / EDITOR / VIEWER
  - 会写入审计日志：`WORKSPACE_MEMBER_UPSERT`

## 审计日志
- `GET /audit?baseId=:baseId` 或 `GET /audit?workspaceId=:workspaceId`
- 仅 OWNER / ADMIN 可见，默认返回最近 200 条

## 用户资料

### 获取当前用户信息
- `GET /users/me`

### 更新当前用户信息
- `PATCH /users/me`
- 请求体（示例）
```json
{ "name": "张三", "avatarUrl": "https://example.com/avatar.png" }
```
