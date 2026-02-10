import { ref, computed } from 'vue';
import type { FilterCondition } from '../../types/table';
import { useWorkStore } from '../../stores/work';
import { checkFilterMatch } from './filterMatcher';

/**
 * 表格过滤：根据 filters 生成 filteredRecords，并提供记录索引映射。
 */
export function useTableFilter() {
  const work = useWorkStore();
  const filters = ref<FilterCondition[]>([]);

  const filteredRecords = computed(() => {
    if (!filters.value.length) return work.records;

    // Create map for faster lookups
    const fieldMap = new Map(work.fields.map(f => [f.id, f]));

    return work.records.filter(record => {
      return filters.value.every(filter => {
        const val = record.data[filter.fieldId];
        const field = fieldMap.get(filter.fieldId);
        return checkFilterMatch(val, filter, field);
      });
    });
  });

  const recordIndexMap = computed(() => {
    const map = new Map<string, number>();
    filteredRecords.value.forEach((record, index) => {
      map.set(record.id, index);
    });
    return map;
  });

  return {
    filters,
    filteredRecords,
    recordIndexMap
  };
}
