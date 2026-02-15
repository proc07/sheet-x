import type { Attachment, Field, FieldType } from '~/types/table'
import { fieldTypeMeta, FIELD_TYPE_SINGLE_SELECT, FIELD_TYPE_MULTI_SELECT } from '~/constants/table'

// ── Deep Clone ───────────────────────────────────────────────
export function cloneDeep<T>(value: T): T {
  return baseClone(value, new WeakMap()) as T
}

function baseClone(value: any, stack: WeakMap<object, any>): any {
  if (!isObject(value)) return value
  if (stack.has(value)) return stack.get(value)

  const tag = Object.prototype.toString.call(value)
  let result: any

  switch (tag) {
    case '[object Array]':
      result = []
      stack.set(value, result)
      ;(value as any[]).forEach((item, index) => {
        result[index] = baseClone(item, stack)
      })
      return result
    case '[object Object]':
      result = {}
      stack.set(value, result)
      Reflect.ownKeys(value).forEach((key) => {
        (result as any)[key] = baseClone((value as any)[key], stack)
      })
      return result
    case '[object Map]': {
      result = new Map()
      stack.set(value, result)
      ;(value as Map<any, any>).forEach((v, k) => {
        result.set(baseClone(k, stack), baseClone(v, stack))
      })
      return result
    }
    case '[object Set]': {
      result = new Set()
      stack.set(value, result)
      ;(value as Set<any>).forEach((v) => {
        result.add(baseClone(v, stack))
      })
      return result
    }
    case '[object Date]':
      return new Date((value as Date).getTime())
    case '[object RegExp]':
      return new RegExp((value as RegExp).source, (value as RegExp).flags)
    case '[object ArrayBuffer]':
      return (value as ArrayBuffer).slice(0)
    default:
      if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
        return new (value as any).constructor(value)
      }
      if (typeof value === 'function') return value
      return value
  }
}

function isObject(val: any): val is object {
  return typeof val === 'object' && val !== null
}

// ── Deep Equal ───────────────────────────────────────────────
export function isEqual(a: any, b: any, seen = new WeakMap()): boolean {
  if (Object.is(a, b)) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  if (seen.get(a) === b) return true
  seen.set(a, b)

  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (a instanceof RegExp && b instanceof RegExp) return a.source === b.source && a.flags === b.flags

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i], seen)) return false
    }
    return true
  }

  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false
    for (const [key, val] of a) {
      if (!b.has(key) || !isEqual(val, b.get(key), seen)) return false
    }
    return true
  }

  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false
    for (const val of a) {
      let found = false
      for (const bVal of b) {
        if (isEqual(val, bVal, seen)) { found = true; break }
      }
      if (!found) return false
    }
    return true
  }

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!isEqual(a[key], b[key], seen)) return false
  }
  return true
}

// ── Field Helpers ────────────────────────────────────────────
export function getFieldTypeIcon(type: FieldType) {
  return fieldTypeMeta[type]?.icon ?? 'i-lucide-help-circle'
}

export function getFieldTypeLabel(type: FieldType) {
  return fieldTypeMeta[type]?.label ?? type
}

export function normalizeRowHeight(value?: number) {
  return value === 1 || value === 2 || value === 4 || value === 6 ? value : 1
}

export function defaultOptionsForField(type: FieldType) {
  if (type === FIELD_TYPE_SINGLE_SELECT || type === FIELD_TYPE_MULTI_SELECT) {
    return {
      choices: [
        { id: 'opt1', label: '选项1' },
        { id: 'opt2', label: '选项2' }
      ]
    }
  }
  return undefined
}

// ── File Helpers ─────────────────────────────────────────────
export function isImage(file: Attachment) {
  return file?.type?.startsWith('image/')
}

export function getFileIcon(file: Attachment) {
  if (!file?.type) return 'i-lucide-file text-gray-500'
  if (file.type.includes('pdf')) return 'i-lucide-file-text text-red-500'
  if (file.type.includes('word') || file.type.includes('document')) return 'i-lucide-file-text text-blue-500'
  if (file.type.includes('excel') || file.type.includes('sheet')) return 'i-lucide-file-spreadsheet text-green-500'
  if (file.type.includes('zip') || file.type.includes('compressed')) return 'i-lucide-archive text-orange-500'
  return 'i-lucide-file text-gray-500'
}

export function getSelectOptionName(field: Field, value: string) {
  const options = field.config?.options as Array<{ id: string, name: string }>
  if (!options) return value
  const opt = options.find(o => o.id === value)
  return opt ? opt.name : value
}

// ── Download ─────────────────────────────────────────────────
export function downloadFile(file: Attachment) {
  const a = document.createElement('a')
  a.href = file.url
  a.download = file.name
  a.click()
}
