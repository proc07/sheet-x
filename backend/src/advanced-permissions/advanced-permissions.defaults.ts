import type { BaseAdvancedPermissionConfig, BaseRole, PermissionLevel, TablePerm } from './advanced-permissions.types';

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function defaultTablePerm(level: PermissionLevel): TablePerm {
  return {
    tablePermission: level,
    record: {
      canCreate: level === 'EDIT' || level === 'MANAGE',
      canDelete: level === 'EDIT' || level === 'MANAGE',
      editScope: { type: 'ALL' },
      readScope: { type: 'ALL' },
    },
    fields: {
      mode: 'ALL',
      permsByFieldId: {},
    },
    views: {
      canManage: level === 'EDIT' || level === 'MANAGE',
      visible: { mode: 'ALL', viewIds: [] },
    },
  };
}

export function defaultOwnerSystemRole(): BaseRole {
  const base: Omit<BaseRole, 'tables'> = {
    id: 'system_owner',
    type: 'system',
    key: 'owner',
    name: '所有者',
    memberUserIds: [],
    dashboard: { permission: 'EDIT' },
    automation: { permission: 'MANAGE' },
    other: { allowCopy: true, allowDuplicate: true, allowDownload: true, allowPrint: true },
  };
  return {
    ...base,
    tables: { '*': defaultTablePerm('MANAGE') },
  };
}

export function defaultEditorSystemRole(): BaseRole {
  const base: Omit<BaseRole, 'tables'> = {
    id: 'system_editor',
    type: 'system',
    key: 'editor',
    name: '编辑者',
    memberUserIds: [],
    dashboard: { permission: 'READ' },
    automation: { permission: 'NONE' },
    other: { allowCopy: true, allowDuplicate: true, allowDownload: true, allowPrint: true },
  };
  return {
    ...base,
    tables: { '*': defaultTablePerm('EDIT') },
  };
}

export function defaultViewerSystemRole(): BaseRole {
  const base: Omit<BaseRole, 'tables'> = {
    id: 'system_viewer',
    type: 'system',
    key: 'viewer',
    name: '阅读者',
    memberUserIds: [],
    dashboard: { permission: 'READ' },
    automation: { permission: 'NONE' },
    other: { allowCopy: true, allowDuplicate: true, allowDownload: true, allowPrint: true },
  };
  return {
    ...base,
    tables: { '*': defaultTablePerm('READ') },
  };
}

export function defaultAdminSystemRole(): BaseRole {
  const base: Omit<BaseRole, 'tables'> = {
    id: 'system_admin',
    type: 'system',
    key: 'admin',
    name: '管理员',
    memberUserIds: [],
    dashboard: { permission: 'EDIT' },
    automation: { permission: 'MANAGE' },
    other: { allowCopy: true, allowDuplicate: true, allowDownload: true, allowPrint: true },
  };
  return {
    ...base,
    tables: { '*': defaultTablePerm('MANAGE') },
  };
}

// 作用：默认的高级权限配置
export function defaultBaseAdvancedPermissionConfig(): BaseAdvancedPermissionConfig {
  return {
    version: 1,
    roles: [defaultOwnerSystemRole(), defaultAdminSystemRole(), defaultEditorSystemRole(), defaultViewerSystemRole()],
  };
}

export function normalizeConfig(raw: any): BaseAdvancedPermissionConfig {
  // 如果 raw 为空/结构不对/版本不对，会回退为默认配置，并补齐系统角色（owner/admin/editor/viewer）。
  if (!raw || typeof raw !== 'object') return defaultBaseAdvancedPermissionConfig();
  if (raw.version !== 1) return defaultBaseAdvancedPermissionConfig();
  if (!Array.isArray(raw.roles)) return defaultBaseAdvancedPermissionConfig();

  const cfg = raw as BaseAdvancedPermissionConfig;

  // 确保系统角色存在
  const ensureSystemRole = (role: BaseRole) => {
    const idx = cfg.roles.findIndex((r) => r.type === 'system' && r.key === role.key);
    if (idx < 0) {
      cfg.roles.push(role);
      return;
    }
    if (role.key === 'owner' || role.key === 'admin') {
      cfg.roles[idx] = role;
      return;
    }
  };

  ensureSystemRole(defaultOwnerSystemRole());
  ensureSystemRole(defaultAdminSystemRole());
  ensureSystemRole(defaultEditorSystemRole());
  ensureSystemRole(defaultViewerSystemRole());
  return cfg;
}

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
export type SystemRoleKey = Exclude<BaseRole['key'], undefined>;

export function workspaceRoleToSystemRoleKey(workspaceRole: WorkspaceRole): SystemRoleKey {
  if (workspaceRole === 'OWNER') return 'owner';
  if (workspaceRole === 'ADMIN') return 'admin';
  if (workspaceRole === 'VIEWER') return 'viewer';
  return 'editor';
}

export function systemRoleKeyToWorkspaceRole(key: SystemRoleKey): WorkspaceRole {
  if (key === 'owner') return 'OWNER';
  if (key === 'admin') return 'ADMIN';
  if (key === 'viewer') return 'VIEWER';
  return 'EDITOR';
}

export function getRoleByWorkspaceRole(config: BaseAdvancedPermissionConfig, workspaceRole: WorkspaceRole): BaseRole {
  const key = workspaceRoleToSystemRoleKey(workspaceRole);
  const role = config.roles.find((r) => r.type === 'system' && r.key === key);
  if (role) return deepClone(role);
  if (key === 'admin') return defaultAdminSystemRole();
  if (key === 'owner') return defaultOwnerSystemRole();
  if (key === 'editor') return defaultEditorSystemRole();
  return defaultViewerSystemRole();
}

// 作用：根据用户的工作空间角色，选择对应的角色（系统角色或自定义角色）
export function pickRoleForUser(config: BaseAdvancedPermissionConfig, workspaceRole: WorkspaceRole, userId: string): BaseRole {
  const custom = config.roles.find((r) => r.type === 'custom' && Array.isArray(r.memberUserIds) && r.memberUserIds.includes(userId));
  if (custom) return deepClone(custom);
  return getRoleByWorkspaceRole(config, workspaceRole);
}

export function getTablePermissionConfig(role: BaseRole, tableId: string): TablePerm {
  const star = role.tables?.['*'];
  const specific = role.tables?.[tableId];
  const base = deepClone(specific ?? star ?? defaultTablePerm(role.key === 'owner' ? 'MANAGE' : role.key === 'viewer' ? 'READ' : 'EDIT'));

  if (!base.record?.editScope) base.record.editScope = { type: 'ALL' };
  if (!base.record?.readScope) base.record.readScope = { type: 'ALL' };
  if (!base.fields) base.fields = { mode: 'ALL', permsByFieldId: {} };
  if (!base.fields.permsByFieldId) base.fields.permsByFieldId = {};
  if (!base.views) base.views = { canManage: base.tablePermission === 'EDIT' || base.tablePermission === 'MANAGE', visible: { mode: 'ALL', viewIds: [] } };
  if (!base.views.visible) base.views.visible = { mode: 'ALL', viewIds: [] };
  if (!Array.isArray(base.views.visible.viewIds)) base.views.visible.viewIds = [];

  if (base.tablePermission === 'MANAGE') {
    base.record.canCreate = true;
    base.record.canDelete = true;
    base.record.editScope = { type: 'ALL' };
    base.record.readScope = { type: 'ALL' };
    base.fields.mode = 'ALL';
    base.fields.permsByFieldId = {};
    base.views.canManage = true;
    base.views.visible = { mode: 'ALL', viewIds: [] };
  }

  if (base.tablePermission === 'READ') {
    base.record.canCreate = false;
    base.record.canDelete = false;
    base.views.canManage = false;
    if (base.fields.mode === 'CUSTOM') {
      Object.keys(base.fields.permsByFieldId ?? {}).forEach((fid) => {
        const p = base.fields.permsByFieldId[fid];
        if (!p) return;
        p.canCreate = false;
        p.canEdit = false;
      });
    }
  }

  if (base.tablePermission === 'NONE') {
    base.record.canCreate = false;
    base.record.canDelete = false;
    base.views.canManage = false;
  }

  if (base.views.visible.mode === 'SPECIFIC') {
    base.views.canManage = false;
  }

  return base;
}
