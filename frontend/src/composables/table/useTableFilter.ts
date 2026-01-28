import { ref, computed } from 'vue';
import type { FilterCondition } from '../../types/table';
import { useWorkStore } from '../../stores/work';
import {
  OP_IS, OP_IS_NOT, OP_CONTAINS, OP_DOES_NOT_CONTAIN,
  OP_IS_EMPTY, OP_IS_NOT_EMPTY,
  OP_EQ, OP_NEQ, OP_GT, OP_LT, OP_GTE, OP_LTE,
  OP_IS_BEFORE, OP_IS_AFTER,
  OP_IS_TRUE, OP_IS_FALSE
} from '../../constants/filter';

export function useTableFilter() {
  const work = useWorkStore();
  const filters = ref<FilterCondition[]>([]);

  function checkFilterMatch(value: any, filter: FilterCondition) {
    const { operator, value: filterValue } = filter;
    
    if (operator === OP_IS_EMPTY) return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
    if (operator === OP_IS_NOT_EMPTY) return !(value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0));

    if (value === null || value === undefined) return false;

    const strValue = String(value).toLowerCase();
    const strFilter = filterValue ? String(filterValue).toLowerCase() : '';

    switch (operator) {
      case OP_IS: return strValue === strFilter;
      case OP_IS_NOT: return strValue !== strFilter;
      case OP_CONTAINS: return strValue.includes(strFilter);
      case OP_DOES_NOT_CONTAIN: return !strValue.includes(strFilter);
      case OP_EQ: return Number(value) === Number(filterValue);
      case OP_NEQ: return Number(value) !== Number(filterValue);
      case OP_GT: return Number(value) > Number(filterValue);
      case OP_LT: return Number(value) < Number(filterValue);
      case OP_GTE: return Number(value) >= Number(filterValue);
      case OP_LTE: return Number(value) <= Number(filterValue);
      case OP_IS_BEFORE: return new Date(value) < new Date(filterValue);
      case OP_IS_AFTER: return new Date(value) > new Date(filterValue);
      case OP_IS_TRUE: return value === true;
      case OP_IS_FALSE: return value === false;
      default: return true;
    }
  }

  const filteredRecords = computed(() => {
    if (!filters.value.length) return work.records;
    
    return work.records.filter(record => {
      return filters.value.every(filter => {
        const val = record.data[filter.fieldId];
        return checkFilterMatch(val, filter);
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
