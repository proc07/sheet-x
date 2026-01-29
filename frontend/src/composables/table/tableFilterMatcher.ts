import type { FilterCondition, Field } from '../../types/table';
import isEqual from '../../utils/isEqual';
import {
  OP_IS,
  OP_IS_NOT,
  OP_CONTAINS,
  OP_DOES_NOT_CONTAIN,
  OP_IS_EMPTY,
  OP_IS_NOT_EMPTY,
  OP_EQ,
  OP_NEQ,
  OP_GT,
  OP_LT,
  OP_GTE,
  OP_LTE,
  OP_IS_BEFORE,
  OP_IS_AFTER,
  OP_IS_TRUE,
  OP_IS_FALSE,
} from '../../constants/filter';

type EffectiveValues = { effectiveValue: any; effectiveFilterValue: any };

function _isObjectLike(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

export function isEffectivelyEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0 || value.every(isEffectivelyEmpty);
  if (_isObjectLike(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) return true;
    return Object.values(value).every(isEffectivelyEmpty);
  }
  return false;
}

function _toSearchStrings(value: any): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    const out: string[] = [];
    for (const item of value) out.push(..._toSearchStrings(item));
    return out;
  }
  if (_isObjectLike(value)) {
    const out: string[] = [];
    for (const v of Object.values(value)) out.push(..._toSearchStrings(v));
    return out;
  }
  return [String(value)];
}

export function areArraysEqualIgnoringOrder(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  const visited = new Array(b.length).fill(false);
  for (const itemA of a) {
    let found = false;
    for (let i = 0; i < b.length; i++) {
      if (!visited[i] && isEqual(itemA, b[i])) {
        visited[i] = true;
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

type FieldNormalizer = (value: any, filterValue: any) => EffectiveValues;

function _normalizeUrl(value: any, filterValue: any): EffectiveValues {
  let effectiveValue = value;
  let effectiveFilterValue = filterValue;

  if (_isObjectLike(effectiveValue) && 'link' in effectiveValue) effectiveValue = (effectiveValue as any).link;
  if (_isObjectLike(effectiveFilterValue) && 'link' in effectiveFilterValue) {
    effectiveFilterValue = (effectiveFilterValue as any).link;
  }

  return { effectiveValue, effectiveFilterValue };
}

const FIELD_NORMALIZERS: Partial<Record<Field['type'], FieldNormalizer>> = {
  URL: _normalizeUrl,
};

export function getEffectiveValues(value: any, filterValue: any, fieldType?: Field['type']): EffectiveValues {
  const normalizer = fieldType ? FIELD_NORMALIZERS[fieldType] : undefined;
  if (normalizer) return normalizer(value, filterValue);
  return { effectiveValue: value, effectiveFilterValue: filterValue };
}

function _matchContains(candidate: any, needle: any): boolean {
  const needleStrings = _toSearchStrings(needle)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  if (needleStrings.length === 0) return true;

  const candidateStrings = _toSearchStrings(candidate)
    .map(s => s.toLowerCase())
    .filter(Boolean);

  for (const n of needleStrings) {
    for (const c of candidateStrings) {
      if (c.includes(n)) return true;
    }
  }
  return false;
}

function _arrayContainsAll(valueArr: any[], filterValue: any): boolean {
  const needles = Array.isArray(filterValue) ? filterValue : [filterValue];
  const activeNeedles = needles.filter(n => !isEffectivelyEmpty(n));
  if (activeNeedles.length === 0) return true;
  return activeNeedles.every(n => valueArr.some(v => _matchContains(v, n)));
}

function _arrayDoesNotContainAll(valueArr: any[], filterValue: any): boolean {
  const needles = Array.isArray(filterValue) ? filterValue : [filterValue];
  const activeNeedles = needles.filter(n => !isEffectivelyEmpty(n));
  if (activeNeedles.length === 0) return true;
  return activeNeedles.every(n => valueArr.every(v => !_matchContains(v, n)));
}

export function checkFilterMatch(value: any, filter: FilterCondition, field?: Field): boolean {
  const { operator, value: filterValue } = filter;
  const { effectiveValue, effectiveFilterValue } = getEffectiveValues(value, filterValue, field?.type);

  if (operator === OP_IS_EMPTY) return isEffectivelyEmpty(effectiveValue);
  if (operator === OP_IS_NOT_EMPTY) return !isEffectivelyEmpty(effectiveValue);

  if (isEffectivelyEmpty(effectiveFilterValue)) return true;

  if (Array.isArray(effectiveValue)) {
    if (operator === OP_IS || operator === OP_EQ) {
      if (Array.isArray(effectiveFilterValue)) {
        return areArraysEqualIgnoringOrder(effectiveValue, effectiveFilterValue);
      }
    }
    if (operator === OP_IS_NOT || operator === OP_NEQ) {
      if (Array.isArray(effectiveFilterValue)) {
        return !areArraysEqualIgnoringOrder(effectiveValue, effectiveFilterValue);
      }
    }
    if (operator === OP_CONTAINS) return _arrayContainsAll(effectiveValue, effectiveFilterValue);
    if (operator === OP_DOES_NOT_CONTAIN) return _arrayDoesNotContainAll(effectiveValue, effectiveFilterValue);
  }

  const strValue = String(effectiveValue).toLowerCase();
  const strFilter = String(effectiveFilterValue).toLowerCase();

  switch (operator) {
    case OP_IS:
      return strValue === strFilter;
    case OP_IS_NOT:
      return strValue !== strFilter;
    case OP_CONTAINS:
      return strValue.includes(strFilter);
    case OP_DOES_NOT_CONTAIN:
      return !strValue.includes(strFilter);
    case OP_EQ:
      return Number(effectiveValue) === Number(effectiveFilterValue);
    case OP_NEQ:
      return Number(effectiveValue) !== Number(effectiveFilterValue);
    case OP_GT:
      return Number(effectiveValue) > Number(effectiveFilterValue);
    case OP_LT:
      return Number(effectiveValue) < Number(effectiveFilterValue);
    case OP_GTE:
      return Number(effectiveValue) >= Number(effectiveFilterValue);
    case OP_LTE:
      return Number(effectiveValue) <= Number(effectiveFilterValue);
    case OP_IS_BEFORE:
      return new Date(effectiveValue) < new Date(effectiveFilterValue);
    case OP_IS_AFTER:
      return new Date(effectiveValue) > new Date(effectiveFilterValue);
    case OP_IS_TRUE:
      return effectiveValue === true;
    case OP_IS_FALSE:
      return effectiveValue === false;
    default:
      return true;
  }
}

