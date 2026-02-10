import { ref, watch, type Ref } from 'vue';
import { useWorkStore } from '../../stores/work';
import { getBatchTableStats } from '../../services/table';
import {
  statOptions,
  STAT_NONE,
  STAT_COUNT_ALL,
  STAT_EMPTY,
  STAT_FILLED,
  STAT_PERCENT_EMPTY,
  STAT_PERCENT_FILLED
} from '../../constants/table';
import { useToast } from 'primevue/usetoast';

// statistics
export function useTableStats(tableId: Ref<string>) {
  const work = useWorkStore();
  const toast = useToast();

  const fieldStats = ref<Record<string, { type: string; value: string | number; loading: boolean }>>({});
  const statPopover = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null);
  const currentStatFieldId = ref<string | null>(null);
  const statPopoverVisible = ref(false);

  function getStatLabel(fieldId: string) {
    const stat = fieldStats.value[fieldId];
    if (!stat || stat.type === STAT_NONE) return '选择计算';
    if (stat.loading) return '计算中...';

    const val = stat.value;
    switch (stat.type) {
      case STAT_COUNT_ALL: return `${val}条记录`;
      case STAT_EMPTY: return `未填写 ${val}`;
      case STAT_FILLED: return `已填写 ${val}`;
      case STAT_PERCENT_EMPTY: return `未填写占比 ${Number(val).toFixed(1)}%`;
      case STAT_PERCENT_FILLED: return `已填写占比 ${Number(val).toFixed(1)}%`;
      default: return '选择计算';
    }
  }

  function openStatPopover(event: Event, fieldId: string) {
    currentStatFieldId.value = fieldId;
    statPopover.value?.toggle(event);
  }

  async function selectStat(type: string) {
    const fieldId = currentStatFieldId.value;
    if (!fieldId) return;
    
    statPopover.value?.hide();

    if (type === STAT_NONE) {
      fieldStats.value[fieldId] = { type, value: 0, loading: false };
      // Persist changes
      await work.updateFieldLayout(tableId.value, [{ id: fieldId, statType: STAT_NONE }]);
      return;
    }

    fieldStats.value[fieldId] = { 
      type, 
      value: fieldStats.value[fieldId]?.value ?? 0, 
      loading: true
    };

    // Persist changes
    work.updateFieldLayout(tableId.value, [{ id: fieldId, statType: type }]);

    try {
      const res = await getBatchTableStats(tableId.value, [{ fieldId, type }]);
      if (res.length > 0) {
        fieldStats.value[fieldId] = { type: res[0].type, value: res[0].value, loading: false };
      }
    } catch (e) {
      console.error(e);
      toast.add({ severity: 'error', summary: '获取统计失败', detail: '请重试', life: 3000 });
      fieldStats.value[fieldId] = { type: STAT_NONE, value: 0, loading: false };
    }
  }

  // Initialize stats from field options
  watch(() => work.fields, async (fields) => {
    const requests: { fieldId: string; type: string }[] = [];
    
    fields.forEach((field) => {
      const statType = field.config?.statType;
      // Skip if already loaded or no stat type
      if (!statType || statType === STAT_NONE || fieldStats.value[field.id]) return;

      fieldStats.value[field.id] = { type: statType, value: 0, loading: true };
      requests.push({ fieldId: field.id, type: statType });
    });

    if (requests.length === 0) return;

    try {
      const res = await getBatchTableStats(tableId.value, requests);
      res.forEach((stat) => {
        fieldStats.value[stat.fieldId] = { type: stat.type, value: stat.value, loading: false };
      });
    } catch (e) {
      console.error(e);
      // On batch error, reset all requested fields to none/error state
      requests.forEach((req) => {
        fieldStats.value[req.fieldId] = { type: STAT_NONE, value: 0, loading: false };
      });
    }
  }, { immediate: true, deep: true });

  return {
    fieldStats,
    statPopover,
    currentStatFieldId,
    statPopoverVisible,
    statOptions,
    getStatLabel,
    openStatPopover,
    selectStat
  };
}
