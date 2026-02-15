import type { Field, FieldType } from '~/types/table'
import { DEFAULT_FIELD_WIDTH } from '~/constants/table'
import { defaultOptionsForField } from '~/utils/helpers'

export function useTableFields(tableId: Ref<string>) {
  const store = useWorkStore()
  const toast = useToast()

  const visibleFields = computed(() =>
    store.fields
      .filter(f => !f.hidden)
      .sort((a, b) => a.position - b.position)
  )

  const frozenFieldIds = computed(() =>
    new Set(store.fields.filter(f => f.frozen).map(f => f.id))
  )

  // ── Field CRUD ─────────────────────────────────────────────
  const fieldFormVisible = ref(false)
  const editingField = ref<Field | null>(null)

  function openFieldForm(field?: Field) {
    editingField.value = field ?? null
    fieldFormVisible.value = true
  }

  function closeFieldForm() {
    fieldFormVisible.value = false
    editingField.value = null
  }

  async function createField(name: string, type: FieldType, config?: any) {
    try {
      const position = store.fields.length
      await store.createField(tableId.value, {
        name,
        type,
        required: false,
        position,
        width: DEFAULT_FIELD_WIDTH,
        config: config ?? defaultOptionsForField(type)
      })
      toast.add({ title: '字段已创建', color: 'success' })
      closeFieldForm()
    }
    catch {
      toast.add({ title: '创建字段失败', color: 'error' })
    }
  }

  async function updateFieldConfig(fieldId: string, patch: Partial<Field>) {
    try {
      await store.updateField(tableId.value, fieldId, patch)
      toast.add({ title: '字段已更新', color: 'success' })
      closeFieldForm()
    }
    catch {
      toast.add({ title: '更新字段失败', color: 'error' })
    }
  }

  async function deleteField(fieldId: string) {
    try {
      await store.deleteField(tableId.value, fieldId)
      toast.add({ title: '字段已删除', color: 'success' })
    }
    catch {
      toast.add({ title: '删除字段失败', color: 'error' })
    }
  }

  // ── Visibility ─────────────────────────────────────────────
  async function toggleFieldVisibility(fieldId: string) {
    const field = store.fields.find(f => f.id === fieldId)
    if (!field) return
    const hidden = !field.hidden
    await persistFieldLayout([{ id: fieldId, hidden }])
  }

  // ── Freeze ─────────────────────────────────────────────────
  async function toggleFieldFreeze(fieldId: string) {
    const field = store.fields.find(f => f.id === fieldId)
    if (!field) return
    const frozen = !field.frozen
    await persistFieldLayout([{ id: fieldId, frozen }])
  }

  // ── Resize ─────────────────────────────────────────────────
  async function resizeField(fieldId: string, width: number) {
    const field = store.fields.find(f => f.id === fieldId)
    if (!field) return
    field.width = Math.max(80, width)
    await persistFieldLayout([{ id: fieldId, width: field.width }])
  }

  // ── Reorder ────────────────────────────────────────────────
  async function reorderFields(orderedIds: string[]) {
    const updates: { id: string, position: number }[] = []
    orderedIds.forEach((id, index) => {
      const field = store.fields.find(f => f.id === id)
      if (field && field.position !== index) {
        field.position = index
        updates.push({ id, position: index })
      }
    })
    if (updates.length > 0) {
      await persistFieldLayout(updates)
    }
  }

  // ── Persist ────────────────────────────────────────────────
  async function persistFieldLayout(updates: Array<{ id: string, position?: number, width?: number, hidden?: boolean, frozen?: boolean }>) {
    if (!tableId.value || updates.length === 0) return
    try {
      await store.updateFieldLayout(tableId.value, updates)
    }
    catch (error) {
      console.error('Failed to update field layout', error)
    }
  }

  // ── Field Header Menu Items ────────────────────────────────
  function getFieldMenuItems(field: Field) {
    return [
      {
        label: '编辑字段',
        icon: 'i-lucide-pencil',
        onSelect: () => openFieldForm(field)
      },
      { type: 'separator' as const },
      {
        label: field.frozen ? '取消冻结' : '冻结列',
        icon: field.frozen ? 'i-lucide-unlock' : 'i-lucide-lock',
        onSelect: () => toggleFieldFreeze(field.id)
      },
      {
        label: '隐藏字段',
        icon: 'i-lucide-eye-off',
        onSelect: () => toggleFieldVisibility(field.id)
      },
      { type: 'separator' as const },
      {
        label: '删除字段',
        icon: 'i-lucide-trash',
        color: 'error' as const,
        onSelect: () => deleteField(field.id)
      }
    ]
  }

  return {
    visibleFields,
    frozenFieldIds,
    fieldFormVisible,
    editingField,
    openFieldForm,
    closeFieldForm,
    createField,
    updateFieldConfig,
    deleteField,
    toggleFieldVisibility,
    toggleFieldFreeze,
    resizeField,
    reorderFields,
    getFieldMenuItems
  }
}
