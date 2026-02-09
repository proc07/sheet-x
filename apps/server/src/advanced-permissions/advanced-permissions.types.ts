export type PermissionLevel = 'NONE' | 'READ' | 'EDIT' | 'MANAGE';

export type ConditionOperator = 'equals' | 'contains' | 'isEmpty' | 'isNotEmpty';

export type RecordScope =
  | { type: 'ALL' }
  | { type: 'CREATED_BY_ME' }
  | { type: 'USER_FIELD_CONTAINS_ME'; userFieldId?: string }
  | { type: 'CONDITION'; conditions: Array<{ fieldId: string; operator: ConditionOperator; value?: string }> }
  | { type: 'SAME_AS_EDIT' };

export type TablePerm = {
  tablePermission: PermissionLevel;
  record: {
    canCreate: boolean;
    canDelete: boolean;
    editScope: RecordScope;
    readScope: RecordScope;
  };
  fields: {
    mode: 'ALL' | 'CUSTOM';
    permsByFieldId: Record<
      string,
      {
        canRead: boolean;
        canCreate: boolean;
        canEdit: boolean;
      }
    >;
  };
  views: {
    canManage: boolean;
    visible: { mode: 'ALL' | 'SPECIFIC'; viewIds: string[] };
  };
};

export type BaseRole = {
  id: string;
  // 系统角色，自定义角色
  type: 'system' | 'custom';
  // 系统角色的 key，自定义角色的 key 为空
  key?: 'owner' | 'admin' | 'editor' | 'viewer';
  name: string;
  memberUserIds: string[];
  tables: Record<string, TablePerm>;
  dashboard: { permission: 'EDIT' | 'READ' | 'NONE' };
  automation: { permission: 'MANAGE' | 'NONE' };
  other: { allowCopy: boolean; allowDuplicate: boolean; allowDownload: boolean; allowPrint: boolean };
};

export type BaseAdvancedPermissionConfig = {
  version: 1;
  roles: BaseRole[];
};

export type EffectiveTablePermission = {
  enabled: boolean;
  role: {
    id: string;
    type: BaseRole['type'];
    key?: BaseRole['key'];
    name: string
  };
  tablePermission: PermissionLevel;
  record: TablePerm['record'];
  fields: TablePerm['fields'];
  views: TablePerm['views'];
  dashboard: BaseRole['dashboard'];
  automation: BaseRole['automation'];
  other: BaseRole['other'];
};
