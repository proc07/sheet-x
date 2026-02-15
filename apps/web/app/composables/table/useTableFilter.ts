import type { FilterCondition, RecordRow, Field } from '~/types/table'
import { checkFilterMatch } from '~/utils/filterMatcher'

export function useTableFilter(
  records: Ref<RecordRow[]>,
  fields: Ref<Field[]>
) {
  const filters = ref<FilterCondition[]>([])

  const filteredRecords = computed(() => {
    if (!filters.value.length) return records.value

    const fieldMap = new Map(fields.value.map(f => [f.id, f]))

    return records.value.filter(record =>
      filters.value.every((filter) => {
        const val = record.data[filter.fieldId]
        const field = fieldMap.get(filter.fieldId)
        return checkFilterMatch(val, filter, field)
      })
    )
  })

  const recordIndexMap = computed(() => {
    const map = new Map<string, number>()
    filteredRecords.value.forEach((r, i) => map.set(r.id, i))
    return map
  })

  function addFilter(filter: FilterCondition) {
    filters.value.push(filter)
  }

  function removeFilter(index: number) {
    filters.value.splice(index, 1)
  }

  function updateFilter(index: number, patch: Partial<FilterCondition>) {
    if (filters.value[index]) {
      Object.assign(filters.value[index], patch)
    }
  }

  function clearFilters() {
    filters.value = []
  }

  return {
    filters,
    filteredRecords,
    recordIndexMap,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters
  }
}
