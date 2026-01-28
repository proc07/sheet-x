import { ref, computed, nextTick, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { useWorkStore } from '../../stores/work';
import { useToast } from 'primevue/usetoast';
import {
  ROW_PADDING,
  HEIGHT_PER_ROW,
  rowHeightOptions,
} from '../../constants/table';
import { normalizeRowHeight } from '../../utils/field';

export function useTableLayout(tableId: Ref<string>) {
  const work = useWorkStore();
  const toast = useToast();

  const dataTable = ref<any>(null);
  const tableWrap = ref<HTMLDivElement | null>(null);
  const rowHeight = ref<typeof rowHeightOptions[number]['value']>(rowHeightOptions[0].value);
  const hasHorizontalScroll = ref(false);
  const tableHeight = ref('');

  // Field Config Layout (Seems unused in template but kept for safety)
  const fieldConfigContent = ref<HTMLElement | null>(null);
  const fieldConfigListMaxHeight = ref(320);

  const virtualScrollerOptions = computed(() => ({
    itemSize: ROW_PADDING + rowHeight.value * HEIGHT_PER_ROW,
    delay: 0,
    numToleratedItems: 20,
  }));

  function updateHorizontalScroll() {
    // 这种获取节点方式有点危险
    const container = tableWrap.value?.querySelector('.p-datatable-table-container')?.childNodes?.[0] as HTMLElement | null;
    if (!container) return;
    const next = container.scrollWidth > container.clientWidth;
    if (next !== hasHorizontalScroll.value) {
      hasHorizontalScroll.value = next;
    }
  }

  function updateTableHeight() {
    const el = tableWrap.value;
    if (!el) return;
    const { top } = el.getBoundingClientRect();
    const height = Math.max(0, window.innerHeight - top);
    const nextHeight = `${Math.floor(height)}px`;
    if (tableHeight.value !== nextHeight) {
      tableHeight.value = nextHeight;
    }
    nextTick(updateHorizontalScroll);
  }

  function updateFieldConfigMaxHeight() {
    const content = fieldConfigContent.value;
    if (!content) return;
    const rect = content.getBoundingClientRect();
    if (!rect.height && !rect.top) return;
    const padding = 16;
    const available = window.innerHeight - rect.top - padding;
    const nextHeight = Math.max(0, Math.floor(available));
    if (Number.isFinite(nextHeight)) {
      fieldConfigListMaxHeight.value = nextHeight;
    }
  }

  function handleWindowResize() {
    updateTableHeight();
    updateFieldConfigMaxHeight();
  }

  function handleWindowScroll() {
    updateFieldConfigMaxHeight();
  }

  function selectRowHeight(value: number) {
    const previous = rowHeight.value;
    // Calculate current scroll index
    const scroller = dataTable.value?.$el.querySelector('.p-datatable-wrapper') || dataTable.value?.$el.querySelector('.p-virtualscroller');
    let topIndex = 0;
    if (scroller) {
      const oldItemSize = ROW_PADDING + previous * HEIGHT_PER_ROW;
      topIndex = Math.floor(scroller.scrollTop / oldItemSize);
    }

    rowHeight.value = value as typeof rowHeightOptions[number]['value'];
    
    // Restore scroll position after render
    nextTick(() => {
      const newScroller = dataTable.value?.$el.querySelector('.p-datatable-wrapper') || dataTable.value?.$el.querySelector('.p-virtualscroller');
      if (newScroller) {
        const newItemSize = ROW_PADDING + value * HEIGHT_PER_ROW;
        newScroller.scrollTop = topIndex * newItemSize;
      }
      updateHorizontalScroll();
    });

    if (!tableId.value) return;

    work.updateTable(tableId.value, { rowHeight: value }).catch((e: any) => {
      const message = e?.response?.data?.message ?? '保存行高失败';
      toast.add({ severity: 'error', summary: '更新失败', detail: message, life: 3000 });
      rowHeight.value = previous;
    });
  }

  // Lifecycle
  onMounted(() => {
    updateTableHeight();
    updateFieldConfigMaxHeight();
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('scroll', handleWindowScroll, true);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleWindowResize);
    window.removeEventListener('scroll', handleWindowScroll, true);
  });

  return {
    dataTable,
    tableWrap,
    rowHeight,
    hasHorizontalScroll,
    tableHeight,
    virtualScrollerOptions,
    fieldConfigContent,
    fieldConfigListMaxHeight,
    selectRowHeight,
    updateHorizontalScroll,
    normalizeRowHeight,
  };
}
