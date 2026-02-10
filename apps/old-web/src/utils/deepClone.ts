export default function cloneDeep<T>(value: T): T {
  return baseClone(value, new WeakMap()) as T;
}

/**
 * 核心递归克隆函数
 */
function baseClone(value: any, stack: WeakMap<object, any>): any {
  // 原始值直接返回
  if (!isObject(value)) {
    return value;
  }

  // 处理循环引用
  if (stack.has(value)) {
    return stack.get(value);
  }

  const tag = getTag(value);
  let result: any;

  switch (tag) {
    case '[object Array]':
      result = [];
      stack.set(value, result);
      (value as any[]).forEach((item, index) => {
        result[index] = baseClone(item, stack);
      });
      return result;

    case '[object Object]':
      result = {};
      stack.set(value, result);
      Reflect.ownKeys(value).forEach((key) => {
        (result as any)[key] = baseClone((value as any)[key], stack);
      });
      return result;

    case '[object Map]':
      result = new Map();
      stack.set(value, result);
      (value as Map<any, any>).forEach((v, k) => {
        result.set(baseClone(k, stack), baseClone(v, stack));
      });
      return result;

    case '[object Set]':
      result = new Set();
      stack.set(value, result);
      (value as Set<any>).forEach((v) => {
        result.add(baseClone(v, stack));
      });
      return result;

    case '[object Date]':
      return new Date((value as Date).getTime());

    case '[object RegExp]':
      return new RegExp((value as RegExp).source, (value as RegExp).flags);

    case '[object Symbol]':
      return Object(Symbol.prototype.valueOf.call(value));

    case '[object ArrayBuffer]':
      return (value as ArrayBuffer).slice(0);

    default:
      // TypedArray / DataView
      if (isTypedArray(value)) {
        return cloneTypedArray(value);
      }

      // 函数：默认不深拷贝函数，直接返回
      if (typeof value === 'function') {
        return value;
      }

      return value;
  }
}

/* ---------------- 工具函数 ---------------- */

function isObject(val: any): val is object {
  return typeof val === 'object' && val !== null;
}

function getTag(val: any): string {
  return Object.prototype.toString.call(val);
}

function isTypedArray(val: any): val is ArrayBufferView {
  return ArrayBuffer.isView(val) && !(val instanceof DataView);
}

function cloneTypedArray(arr: any): any {
  return new arr.constructor(arr);
}
