export type ValueOf<T> = T[keyof T];

// 角色类型（与后端 BaseRole.type 对齐）
export const ROLE_TYPE = {
  SYSTEM: 'system',
  CUSTOM: 'custom',
} as const;

// 系统角色 key（与后端 BaseRole.key 对齐，约定小写用于配置/JSON）
// 注意：这不是 workspace member 的角色枚举（后者是 OWNER/ADMIN/... 大写）
export const ROLE_KEY = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

// 表权限枚举（与后端 PermissionLevel 对齐）
// 这里的 4 档权限用于“表/记录/字段/视图”等数据权限模块
export const TABLE_PERMISSION = {
  MANAGE: 'MANAGE',
  EDIT: 'EDIT',
  READ: 'READ',
  NONE: 'NONE',
} as const;

// - ALL ：所有字段都按默认规则（基本等价于“全部字段可读/可编辑”，不需要逐字段配置）
// - CUSTOM ：启用字段级细粒度控制，用 permsByFieldId[fieldId] 为每个字段单独配置 canRead/canCreate/canEdit
export const FIELD_MODE = {
  ALL: 'ALL',
  CUSTOM: 'CUSTOM',
} as const;
// - ALL ：所有视图都可见（不需要列出具体 viewId）
// - SPECIFIC ：只允许 viewIds 里列出的那些视图可见；并且通常会限制 views.canManage （因为“只给部分可见”时不应允许用户新建/改视图影响可见性）
export const VIEW_VISIBLE_MODE = {
  ALL: 'ALL',
  SPECIFIC: 'SPECIFIC',
} as const;

// 记录范围枚举（与后端 RecordScope.type 对齐）
// 用于控制“可编辑/可阅读”的记录集合（全部、我创建、人员字段包含我、条件、同编辑范围）
export const SCOPE_TYPE = {
  ALL: 'ALL',
  CREATED_BY_ME: 'CREATED_BY_ME',
  USER_FIELD_CONTAINS_ME: 'USER_FIELD_CONTAINS_ME',
  CONDITION: 'CONDITION',
  SAME_AS_EDIT: 'SAME_AS_EDIT',
} as const;

export type TablePermission = ValueOf<typeof TABLE_PERMISSION>;
export type FieldMode = ValueOf<typeof FIELD_MODE>;
export type ViewVisibleMode = ValueOf<typeof VIEW_VISIBLE_MODE>;
export type ScopeType = ValueOf<typeof SCOPE_TYPE>;

// 单表权限配置：描述“某角色在某张表”上的权限模型（与后端 TablePerm 对齐）
// 之所以拆成 tablePermission/record/fields/views，是为了支持从粗到细逐层收敛权限
export interface RoleTablePerm {
  tablePermission: TablePermission;
  record: {
    canCreate: boolean;
    canDelete: boolean;
    editScope: { type: ScopeType; userFieldId?: string; conditions: any[] };
    readScope: { type: ScopeType; userFieldId?: string; conditions: any[] };
  };
  fields: { mode: FieldMode; permsByFieldId: Record<string, { canRead: boolean; canCreate: boolean; canEdit: boolean }> };
  views: { canManage: boolean; visible: { mode: ViewVisibleMode; viewIds: string[] } };
}

// 角色定义：系统角色/自定义角色 模型（与后端 BaseRole 对齐）
// dashboard/automation 的权限档位比 TABLE_PERMISSION 更少：dashboard 只有 EDIT/READ/NONE；automation 只有 MANAGE/NONE（后端也是这样定义的）
export interface Role {
  id: string;
  type: ValueOf<typeof ROLE_TYPE>;
  key?: ValueOf<typeof ROLE_KEY>;
  name: string;
  memberUserIds: string[];
  tables: Record<string, RoleTablePerm>;
  dashboard: { permission: typeof TABLE_PERMISSION.EDIT | typeof TABLE_PERMISSION.READ | typeof TABLE_PERMISSION.NONE };
  automation: { permission: typeof TABLE_PERMISSION.MANAGE | typeof TABLE_PERMISSION.NONE };
  other: { allowCopy: boolean; allowDuplicate: boolean; allowDownload: boolean; allowPrint: boolean };
}
