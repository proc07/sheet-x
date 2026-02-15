import { statOptions, STAT_NONE } from '~/constants/table'

export function useTableStats(tableId: Ref<string>) {
  const store = useWorkStore()

  const fieldStats = ref<Record<string, { type: string, value: string | number, loading: boolean }>>({})
  const activeStatFieldId = ref<string | null>(null)

  function getStatLabel(type: string) {
    return statOptions.find(o => o.value === type)?.label ?? type
  }

  function getFieldStatDisplay(fieldId: string) {
    const stat = fieldStats.value[fieldId]
    if (!stat || stat.type === STAT_NONE) return null
    return stat
  }

  async function selectStat(fieldId: string, type: string) {
    if (type === STAT_NONE) {
      delete fieldStats.value[fieldId]
      activeStatFieldId.value = null
      return
    }

    fieldStats.value[fieldId] = { type, value: '', loading: true }
    activeStatFieldId.value = null

    try {
      const res = await store.getBatchTableStats(tableId.value, [{ fieldId, type }])
      if (res.length > 0) {
        fieldStats.value[fieldId] = { type: res[0]?.type ?? type, value: res[0]?.value ?? '', loading: false }
      }
    }
    catch {
      delete fieldStats.value[fieldId]
    }
  }

  function openStatPopover(fieldId: string) {
    activeStatFieldId.value = fieldId
  }

  function closeStatPopover() {
    activeStatFieldId.value = null
  }

  return {
    fieldStats,
    activeStatFieldId,
    statOptions,
    getStatLabel,
    getFieldStatDisplay,
    selectStat,
    openStatPopover,
    closeStatPopover
  }
}
