import type { RecordRow } from '~/types/table'

export function useTableSelection(
  tableId: Ref<string>,
  insertRecord: (position: number) => Promise<void>,
  deleteRecords: (recordIds: string[]) => Promise<void>
) {
  const toast = useToast()

  const selectedRows = ref<Record<string, boolean>>({})
  const contextMenuTarget = ref<RecordRow | null>(null)

  const selectedRowIds = computed(() =>
    Object.entries(selectedRows.value)
      .filter(([, v]) => v)
      .map(([id]) => id)
  )

  const selectedCount = computed(() => selectedRowIds.value.length)

  function toggleRowSelection(id: string, selected?: boolean) {
    if (selected !== undefined) {
      selectedRows.value[id] = selected
    }
    else {
      selectedRows.value[id] = !selectedRows.value[id]
    }
  }

  function toggleAllRows(records: RecordRow[], selected: boolean) {
    const next: Record<string, boolean> = {}
    if (selected) {
      for (const r of records) next[r.id] = true
    }
    selectedRows.value = next
  }

  function clearSelection() {
    selectedRows.value = {}
  }

  function copySelectedIds() {
    const ids = selectedRowIds.value.join('\n')
    navigator.clipboard.writeText(ids)
    toast.add({ title: '已复制行 ID', color: 'success' })
  }

  // ── Context Menu ───────────────────────────────────────────
  function getContextMenuItems(record: RecordRow, rowIndex: number) {
    return [
      {
        label: '复制行 ID',
        icon: 'i-lucide-copy',
        onSelect() {
          navigator.clipboard.writeText(record.id)
          toast.add({ title: '已复制', color: 'success' })
        }
      },
      { type: 'separator' as const },
      {
        label: '在上方插入行',
        icon: 'i-lucide-arrow-up',
        onSelect: () => insertRecord(rowIndex)
      },
      {
        label: '在下方插入行',
        icon: 'i-lucide-arrow-down',
        onSelect: () => insertRecord(rowIndex + 1)
      },
      { type: 'separator' as const },
      {
        label: selectedCount.value > 1
          ? `删除 ${selectedCount.value} 行`
          : '删除行',
        icon: 'i-lucide-trash',
        color: 'error' as const,
        onSelect() {
          const ids = selectedCount.value > 0
            ? selectedRowIds.value
            : [record.id]
          deleteRecords(ids).then(() => clearSelection())
        }
      }
    ]
  }

  return {
    selectedRows,
    selectedRowIds,
    selectedCount,
    contextMenuTarget,
    toggleRowSelection,
    toggleAllRows,
    clearSelection,
    copySelectedIds,
    getContextMenuItems
  }
}
