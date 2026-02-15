import type { Field, RecordRow } from '~/types/table'
import { cloneDeep } from '~/utils/helpers'

export function useTableRecords(tableId: Ref<string>) {
  const store = useWorkStore()
  const toast = useToast()

  // ── Cell Editing State ─────────────────────────────────────
  const editingCell = ref<{ recordId: string, fieldId: string } | null>(null)
  const editingValue = ref<any>(null)

  const recordUpdateQueue = new Map<string, Promise<void>>()

  function startEdit(recordId: string, fieldId: string, currentValue: any) {
    editingCell.value = { recordId, fieldId }
    editingValue.value = cloneDeep(currentValue)
  }

  function cancelEdit() {
    editingCell.value = null
    editingValue.value = null
  }

  async function commitEdit() {
    if (!editingCell.value) return
    const { recordId, fieldId } = editingCell.value
    const value = editingValue.value

    const record = store.records.find(r => r.id === recordId)
    if (!record) return

    // Optimistic update
    record.data[fieldId] = cloneDeep(value)

    editingCell.value = null
    editingValue.value = null

    // Queue API update
    queueRecordUpdate(recordId, async () => {
      try {
        await store.patchRecord(recordId, record.revision, { [fieldId]: value })
      }
      catch (err: any) {
        if (err?.statusCode === 409) {
          toast.add({ title: '数据冲突，正在刷新', color: 'warning' })
          await store.loadRecords(tableId.value)
        } else {
          toast.add({ title: '更新失败', color: 'error' })
        }
      }
    })
  }

  function queueRecordUpdate(recordId: string, task: () => Promise<void>) {
    const previous = recordUpdateQueue.get(recordId) ?? Promise.resolve()
    const next = previous
      .catch(() => undefined)
      .then(task)
      .finally(() => {
        if (recordUpdateQueue.get(recordId) === next) {
          recordUpdateQueue.delete(recordId)
        }
      })
    recordUpdateQueue.set(recordId, next)
    return next
  }

  // ── Record CRUD ────────────────────────────────────────────
  async function addRecord(defaultData?: Record<string, any>) {
    try {
      const data = defaultData ?? buildDefaultData(store.fields)
      await store.createRecord(tableId.value, data)
    }
    catch {
      toast.add({ title: '添加记录失败', color: 'error' })
    }
  }

  async function insertRecord(position: number, defaultData?: Record<string, any>) {
    try {
      const data = defaultData ?? buildDefaultData(store.fields)
      await store.createRecord(tableId.value, data, position)
    }
    catch {
      toast.add({ title: '插入记录失败', color: 'error' })
    }
  }

  async function deleteRecord(recordId: string) {
    try {
      await store.deleteRecord(recordId)
      toast.add({ title: '记录已删除', color: 'success' })
    }
    catch {
      toast.add({ title: '删除记录失败', color: 'error' })
    }
  }

  async function deleteRecords(recordIds: string[]) {
    try {
      await store.deleteRecords(recordIds)
      toast.add({ title: `${recordIds.length} 条记录已删除`, color: 'success' })
    }
    catch {
      toast.add({ title: '批量删除失败', color: 'error' })
    }
  }

  // ── Attachment Preview ─────────────────────────────────────
  const previewAttachment = ref<{ url: string, name: string } | null>(null)

  function openAttachmentPreview(url: string, name: string) {
    previewAttachment.value = { url, name }
  }

  function closeAttachmentPreview() {
    previewAttachment.value = null
  }

  return {
    editingCell,
    editingValue,
    previewAttachment,
    startEdit,
    cancelEdit,
    commitEdit,
    addRecord,
    insertRecord,
    deleteRecord,
    deleteRecords,
    openAttachmentPreview,
    closeAttachmentPreview
  }
}

// ── Helpers ──────────────────────────────────────────────────
function buildDefaultData(fields: Field[]) {
  const data: Record<string, any> = {}
  for (const field of fields) {
    if (field.config?.defaultValue !== undefined) {
      data[field.id] = cloneDeep(field.config.defaultValue)
    }
  }
  return data
}
