import { describe, expect, it } from 'vitest';
import { matchesScope } from '../advanced-permissions.evaluator';
import type { RecordScope } from '../advanced-permissions.types';

describe('matchesScope', () => {
  it('ALL matches any record', () => {
    const scope: RecordScope = { type: 'ALL' };
    expect(matchesScope(scope, { createdByUserId: null, data: {} }, 'u1')).toBe(true);
  });

  it('CREATED_BY_ME matches creator', () => {
    const scope: RecordScope = { type: 'CREATED_BY_ME' };
    expect(matchesScope(scope, { createdByUserId: 'u1', data: {} }, 'u1')).toBe(true);
    expect(matchesScope(scope, { createdByUserId: 'u2', data: {} }, 'u1')).toBe(false);
  });

  it('USER_FIELD_CONTAINS_ME matches string or array', () => {
    const scope: RecordScope = { type: 'USER_FIELD_CONTAINS_ME', userFieldId: 'f1' };
    expect(matchesScope(scope, { createdByUserId: null, data: { f1: 'u1' } }, 'u1')).toBe(true);
    expect(matchesScope(scope, { createdByUserId: null, data: { f1: ['u1', 'u2'] } }, 'u1')).toBe(true);
    expect(matchesScope(scope, { createdByUserId: null, data: { f1: ['u2'] } }, 'u1')).toBe(false);
  });

  it('CONDITION supports equals and isEmpty', () => {
    const scope: RecordScope = {
      type: 'CONDITION',
      conditions: [
        { fieldId: 'f1', operator: 'equals', value: 'a' },
        { fieldId: 'f2', operator: 'isEmpty' },
      ],
    };
    expect(matchesScope(scope, { createdByUserId: null, data: { f1: 'a', f2: '' } }, 'u1')).toBe(true);
    expect(matchesScope(scope, { createdByUserId: null, data: { f1: 'b', f2: '' } }, 'u1')).toBe(false);
  });

  it('SAME_AS_EDIT delegates to editScope', () => {
    const readScope: RecordScope = { type: 'SAME_AS_EDIT' };
    const editScope: RecordScope = { type: 'CREATED_BY_ME' };
    expect(matchesScope(readScope, { createdByUserId: 'u1', data: {} }, 'u1', editScope)).toBe(true);
    expect(matchesScope(readScope, { createdByUserId: 'u2', data: {} }, 'u1', editScope)).toBe(false);
  });
});

