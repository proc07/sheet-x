import { ref, computed, type Ref } from 'vue';
import type { MenuItem } from 'primevue/menuitem';
import type { DataTableRowContextMenuEvent, DataTableSelectAllChangeEvent } from 'primevue/datatable';
import type { InputNumberInputEvent } from 'primevue/inputnumber';
import { useWorkStore, type RecordRow } from '../../stores/work';
import { useToast } from 'primevue/usetoast';

interface SelectionActions {
  insertRows: (direction: 'above' | 'below', count: number, anchorRecord: RecordRow) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
}

export function useTableSelection(actions: SelectionActions) {
  const work = useWorkStore();
  const toast = useToast();

  const selectedRows = ref<RecordRow[]>([]);
  const selectedRowIds = computed(() => new Set(selectedRows.value.map((row) => row.id)));
  
  const rowMenu = ref<{ show: (event: Event) => void; hide: () => void } | null>(null);
  const contextMenuRow = ref<RecordRow | null>(null);
  const insertAboveCount = ref(1);
  const insertBelowCount = ref(1);

  function onSelectAllChange(event: DataTableSelectAllChangeEvent) {
    selectedRows.value = event.checked ? [...work.records] : [];
  }

  function onRowContextMenu(event: DataTableRowContextMenuEvent) {
    event.originalEvent.preventDefault();
    insertAboveCount.value = 1;
    insertBelowCount.value = 1;
    contextMenuRow.value = event.data ?? null;
    rowMenu.value?.show(event.originalEvent);
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      toast.add({ severity: 'success', summary: '复制成功', detail: id, life: 1000 });
    }).catch(() => {
      toast.add({ severity: 'error', summary: '复制失败', life: 2000 });
    });
  }

  // Insert Count Logic
  function normalizeInsertCount(value: unknown) {
    const count = Math.floor(Number(value));
    if (!Number.isFinite(count) || count < 1) return 1;
    return Math.min(count, 100);
  }
  function getInsertCount(direction: 'above' | 'below') {
    return direction === 'above' ? insertAboveCount.value : insertBelowCount.value;
  }
  function setInsertCount(direction: 'above' | 'below', value: unknown) {
    const next = normalizeInsertCount(value);
    if (direction === 'above') {
      insertAboveCount.value = next;
    } else {
      insertBelowCount.value = next;
    }
    return next;
  }
  function onInsertInput(direction: 'above' | 'below', event: InputNumberInputEvent) {
    const newValue = setInsertCount(direction, event?.value);
    // Sync the input value to avoid PrimeVue InputNumber internal state desync
    const target = event?.originalEvent?.target;
    if (target instanceof HTMLInputElement) {
      const nextValue = String(newValue);
      if (target.value !== nextValue) {
        target.value = nextValue;
      }
    }
  }

  async function handleInsertRows(direction: 'above' | 'below') {
    const anchor = contextMenuRow.value;
    if (!anchor) return;
    const count = normalizeInsertCount(getInsertCount(direction));
    
    await actions.insertRows(direction, count, anchor);
    rowMenu.value?.hide?.();
  }

  async function deleteContextRow() {
    const target = contextMenuRow.value;
    if (!target) return;
    await actions.deleteRecord(target.id);
    contextMenuRow.value = null;
    rowMenu.value?.hide?.();
  }

  function handleMenuAction(label: string) {
    if (!contextMenuRow.value) return;
    console.info(`[Table] ${label}`, contextMenuRow.value);
  }

  const rowMenuItems = computed<MenuItem[]>(() => {
    const disabled = !contextMenuRow.value;
    return [
      { label: '向上插入', icon: 'pi pi-arrow-up', type: 'insert', direction: 'above', command: () => handleInsertRows('above'), disabled },
      { label: '向下插入', icon: 'pi pi-arrow-down', type: 'insert', direction: 'below', command: () => handleInsertRows('below'), disabled },
      { separator: true },
      { label: '查看详情', icon: 'pi pi-info-circle', command: () => handleMenuAction('查看详情'), disabled },
      { label: '添加子记录', icon: 'pi pi-sitemap', command: () => handleMenuAction('添加子记录'), disabled },
      { label: '查看记录历史', icon: 'pi pi-history', command: () => handleMenuAction('查看记录历史'), disabled },
      { label: '添加评论', icon: 'pi pi-comment', command: () => handleMenuAction('添加评论'), disabled },
      { separator: true },
      { label: '删除记录', icon: 'pi pi-trash', class: 'text-red-500', command: () => deleteContextRow(), disabled },
    ];
  });

  return {
    selectedRows,
    selectedRowIds,
    rowMenu,
    contextMenuRow,
    rowMenuItems,
    onSelectAllChange,
    onRowContextMenu,
    copyId,
    getInsertCount,
    setInsertCount,
    onInsertInput,
  };
}
