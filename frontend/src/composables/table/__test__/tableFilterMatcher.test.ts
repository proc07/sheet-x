import { describe, expect, it } from 'vitest';
import {
  OP_CONTAINS,
  OP_DOES_NOT_CONTAIN,
  OP_IS,
  OP_IS_EMPTY,
  OP_IS_AFTER,
  OP_IS_BEFORE,
  OP_IS_NOT,
  OP_IS_NOT_EMPTY,
} from '../../../constants/filter';
import { checkFilterMatch, isEffectivelyEmpty } from '../filterMatcher';

describe('isEffectivelyEmpty', () => {
  it('handles primitives', () => {
    expect(isEffectivelyEmpty('')).toBe(true);
    expect(isEffectivelyEmpty('  ')).toBe(true);
    expect(isEffectivelyEmpty('a')).toBe(false);
    expect(isEffectivelyEmpty(0)).toBe(false);
    expect(isEffectivelyEmpty(false)).toBe(false);
    expect(isEffectivelyEmpty(null)).toBe(true);
    expect(isEffectivelyEmpty(undefined)).toBe(true);
  });

  it('handles arrays and objects deeply', () => {
    expect(isEffectivelyEmpty([])).toBe(true);
    expect(isEffectivelyEmpty(['', ' '])).toBe(true);
    expect(isEffectivelyEmpty(['a'])).toBe(false);
    expect(isEffectivelyEmpty({})).toBe(true);
    expect(isEffectivelyEmpty({ a: '' })).toBe(true);
    expect(isEffectivelyEmpty({ a: { b: '' } })).toBe(true);
    expect(isEffectivelyEmpty({ a: { b: 'x' } })).toBe(false);
  });
});

describe('checkFilterMatch - array operators', () => {
  it('supports OP_CONTAINS on string array', () => {
    expect(checkFilterMatch(['hello', 'world'], { fieldId: 'f1', operator: OP_CONTAINS, value: 'wor' })).toBe(true);
    expect(checkFilterMatch(['hello', 'world'], { fieldId: 'f1', operator: OP_CONTAINS, value: 'zzz' })).toBe(false);
  });

  it('supports OP_DOES_NOT_CONTAIN on string array', () => {
    expect(checkFilterMatch(['hello', 'world'], { fieldId: 'f1', operator: OP_DOES_NOT_CONTAIN, value: 'wor' })).toBe(false);
    expect(checkFilterMatch(['hello', 'world'], { fieldId: 'f1', operator: OP_DOES_NOT_CONTAIN, value: 'zzz' })).toBe(true);
  });

  it('supports OP_CONTAINS on object array (search through values)', () => {
    const value = [{ name: 'Alpha', link: 'https://example.com/a' }, { name: 'Beta' }];
    expect(checkFilterMatch(value, { fieldId: 'f1', operator: OP_CONTAINS, value: 'example.com' })).toBe(true);
    expect(checkFilterMatch(value, { fieldId: 'f1', operator: OP_CONTAINS, value: 'gamma' })).toBe(false);
  });

  it('supports OP_CONTAINS on mixed array', () => {
    const value = [{ name: 'Alpha' }, 'Beta'];
    expect(checkFilterMatch(value, { fieldId: 'f1', operator: OP_CONTAINS, value: 'bet' })).toBe(true);
    expect(checkFilterMatch(value, { fieldId: 'f1', operator: OP_CONTAINS, value: 'alp' })).toBe(true);
  });

  it('supports OP_IS_EMPTY and OP_IS_NOT_EMPTY on arrays', () => {
    expect(checkFilterMatch([], { fieldId: 'f1', operator: OP_IS_EMPTY, value: undefined })).toBe(true);
    expect(checkFilterMatch([''], { fieldId: 'f1', operator: OP_IS_EMPTY, value: undefined })).toBe(true);
    expect(checkFilterMatch([{}], { fieldId: 'f1', operator: OP_IS_EMPTY, value: undefined })).toBe(true);
    expect(checkFilterMatch([{ a: '' }], { fieldId: 'f1', operator: OP_IS_EMPTY, value: undefined })).toBe(true);
    expect(checkFilterMatch(['x'], { fieldId: 'f1', operator: OP_IS_EMPTY, value: undefined })).toBe(false);
    expect(checkFilterMatch([{ a: 'x' }], { fieldId: 'f1', operator: OP_IS_EMPTY, value: undefined })).toBe(false);

    expect(checkFilterMatch([], { fieldId: 'f1', operator: OP_IS_NOT_EMPTY, value: undefined })).toBe(false);
    expect(checkFilterMatch(['x'], { fieldId: 'f1', operator: OP_IS_NOT_EMPTY, value: undefined })).toBe(true);
  });

  it('supports multi-needle contains when filterValue is array', () => {
    const value = ['Alpha', 'Beta', 'Gamma'];
    expect(checkFilterMatch(value, { fieldId: 'f1', operator: OP_CONTAINS, value: ['alp', 'bet'] })).toBe(true);
    expect(checkFilterMatch(value, { fieldId: 'f1', operator: OP_CONTAINS, value: ['alp', 'zzz'] })).toBe(false);
    expect(checkFilterMatch(value, { fieldId: 'f1', operator: OP_DOES_NOT_CONTAIN, value: ['alp', 'bet'] })).toBe(false);
    expect(checkFilterMatch(value, { fieldId: 'f1', operator: OP_DOES_NOT_CONTAIN, value: ['zzz', 'yyy'] })).toBe(true);
  });

  it('keeps backward compatibility for array equality (ignoring order)', () => {
    const a = [{ id: 1 }, { id: 2 }];
    const b = [{ id: 2 }, { id: 1 }];
    expect(checkFilterMatch(a, { fieldId: 'f1', operator: OP_IS, value: b })).toBe(true);
    expect(checkFilterMatch(a, { fieldId: 'f1', operator: OP_IS_NOT, value: b })).toBe(false);
  });
});

describe('checkFilterMatch - URL normalization', () => {
  it('matches URL when filterValue is UrlData and value is string', () => {
    const field = { id: 'f1', name: 'url', type: 'URL', required: false, position: 1 } as any;
    const value = 'https://example.com';
    const filterValue = { link: 'https://example.com', text: 'Example' };
    expect(checkFilterMatch(value, { fieldId: 'f1', operator: OP_IS, value: filterValue }, field)).toBe(true);
    expect(checkFilterMatch(value, { fieldId: 'f1', operator: OP_CONTAINS, value: { link: 'example.com', text: '' } }, field)).toBe(true);
  });
});

describe('checkFilterMatch - DATE normalization', () => {
  it('normalizes ISO string and Date to comparable values', () => {
    const field = { id: 'f1', name: 'date', type: 'DATE', required: false, position: 1, config: { format: 'YYYY/MM/DD' } } as any;
    const iso = '2026-01-29T13:18:16.693Z';
    const d = new Date(iso);

    expect(checkFilterMatch(iso, { fieldId: 'f1', operator: OP_IS, value: d }, field)).toBe(true);
    expect(checkFilterMatch(iso, { fieldId: 'f1', operator: OP_IS_BEFORE, value: new Date('2026-01-30T00:00:00.000Z') }, field)).toBe(true);
    expect(checkFilterMatch(iso, { fieldId: 'f1', operator: OP_IS_AFTER, value: new Date('2026-01-01T00:00:00.000Z') }, field)).toBe(true);
  });
});
