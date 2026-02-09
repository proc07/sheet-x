import type { RecordScope } from './advanced-permissions.types';

function isEmptyValue(v: any) {
  return v === null || v === undefined || v === '';
}

function asString(v: any) {
  if (v === null || v === undefined) return '';
  return typeof v === 'string' ? v : JSON.stringify(v);
}

function matchesCondition(conditions: Array<{ fieldId: string; operator: string; value?: string }>, recordData: Record<string, any>) {
  for (const c of conditions) {
    if (!c?.fieldId || !c?.operator) return false;
    const val = recordData?.[c.fieldId];
    if (c.operator === 'isEmpty') {
      if (!isEmptyValue(val)) return false;
      continue;
    }
    if (c.operator === 'isNotEmpty') {
      if (isEmptyValue(val)) return false;
      continue;
    }
    const target = c.value ?? '';
    if (c.operator === 'equals') {
      if (asString(val) !== target) return false;
      continue;
    }
    if (c.operator === 'contains') {
      if (!asString(val).includes(target)) return false;
      continue;
    }
    return false;
  }
  return true;
}

export function matchesScope(
  scope: RecordScope,
  record: { createdByUserId?: string | null; data: Record<string, any> },
  userId: string,
  editScope?: RecordScope
): boolean {
  if (!scope) return false;
  if (scope.type === 'SAME_AS_EDIT') {
    return editScope ? matchesScope(editScope, record, userId) : true;
  }
  if (scope.type === 'ALL') return true;
  if (scope.type === 'CREATED_BY_ME') return !!record.createdByUserId && record.createdByUserId === userId;
  if (scope.type === 'USER_FIELD_CONTAINS_ME') {
    const fieldId = scope.userFieldId;
    if (!fieldId) return false;
    const val = record.data?.[fieldId];
    if (Array.isArray(val)) return val.includes(userId);
    if (typeof val === 'string') return val === userId;
    if (val && typeof val === 'object') {
      if (typeof (val as any).id === 'string') return (val as any).id === userId;
      if (Array.isArray((val as any).ids)) return (val as any).ids.includes(userId);
    }
    return false;
  }
  if (scope.type === 'CONDITION') {
    const conditions = Array.isArray(scope.conditions) ? scope.conditions : [];
    return matchesCondition(conditions as any, record.data ?? {});
  }
  return false;
}

