export default function isEqual(a: any, b: any, seen = new WeakMap()) {
  // SameValueZero（NaN === NaN）
  if (Object.is(a, b)) return true;

  // null / undefined
  if (a == null || b == null) return false;

  // 类型不同
  if (typeof a !== typeof b) return false;

  // 非对象（primitive 已在上面处理）
  if (typeof a !== 'object') return false;

  // 循环引用处理
  if (seen.get(a) === b) return true;
  seen.set(a, b);

  // Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }

  // Array
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i], seen)) return false;
    }
    return true;
  }

  // Map
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, val] of a) {
      if (!b.has(key)) return false;
      if (!isEqual(val, b.get(key), seen)) return false;
    }
    return true;
  }

  // Set
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const val of a) {
      // Set 是无序的
      let found = false;
      for (const bVal of b) {
        if (isEqual(val, bVal, seen)) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }

  // 普通对象
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isEqual(a[key], b[key], seen)) return false;
  }

  return true;
}
