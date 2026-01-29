import { ref, type Ref } from 'vue';
import type { RecordRow } from '../../types/table';
import { useWorkStore } from '../../stores/work';
import { api } from '../../api';
import { useToast } from 'primevue/usetoast';
import isEqual from '../../utils/isEqual';
import type {
  DataTableCellEditInitEvent,
  DataTableCellEditCompleteEvent,
  DataTableCellEditCancelEvent,
} from 'primevue/datatable';

interface TableRecordsCallbacks {
  onLayoutUpdate?: () => void;
}

export function useTableRecords(tableId: Ref<string>, callbacks?: TableRecordsCallbacks) {
  const work = useWorkStore();
  const toast = useToast();

  const loading = ref(false);
  const editingRowId = ref<string | null>(null);
  const recordUpdateQueue = new Map<string, Promise<void>>();

  // Attachment Preview
  const attachmentPreviewPopover = ref();
  const previewFile = ref<any>(null);
  const hideTimer = ref<number | null>(null);

  async function reload() {
    if (!tableId.value) return;
    loading.value = true;
    try {
      const table = await work.loadTable(tableId.value);
      await work.loadFields(tableId.value);
      await work.loadRecords(tableId.value);
      callbacks?.onLayoutUpdate?.();
      return table;
    } catch (e: any) {
      toast.add({ severity: 'error', summary: '更新失败', detail: e?.response?.data?.message ?? '加载失败' });
    } finally {
      loading.value = false;
    }
  }

  async function createRecord() {
    if (!tableId.value) return;
    
    const initialData: Record<string, any> = {};
    work.fields.forEach(field => {
      const val = field.config?.defaultValue;
      if (val !== undefined && val !== null && val !== '') {
        initialData[field.id] = val;
      }
    });

    await work.createRecord(tableId.value, initialData);
  }

  async function deleteRecord(recordId: string) {
    await work.deleteRecord(recordId);
  }

  async function insertRows(direction: 'above' | 'below', count: number, anchor: RecordRow) {
    if (!tableId.value || !anchor || count < 1) return;
    
    const anchorIndex = work.records.findIndex((record) => record.id === anchor.id);
    if (anchorIndex < 0) return;
    
    const insertIndex = direction === 'above' ? anchorIndex : anchorIndex + 1;

    try {
      const created: RecordRow[] = [];
      for (let i = 0; i < count; i += 1) {
        const { data } = await api.post('/records', { tableId: tableId.value, data: {} });
        created.push(data as RecordRow);
      }
      work.records.splice(insertIndex, 0, ...created);
      callbacks?.onLayoutUpdate?.();
    } catch (e: any) {
      toast.add({ severity: 'error', summary: '插入记录失败', detail: e?.response?.data?.message ?? '插入记录失败' });
    }
  }

  // Cell Editing
  function onCellEditInit(event: DataTableCellEditInitEvent<RecordRow>) {
    editingRowId.value = event.data?.id ?? null;
  }

  function onCellEditComplete(event: DataTableCellEditCompleteEvent<RecordRow>) {
    if (editingRowId.value === event.data?.id) {
      editingRowId.value = null;
    }
  }

  function onCellEditCancel(event: DataTableCellEditCancelEvent) {
    if (editingRowId.value === event.data?.id) {
      editingRowId.value = null;
    }
  }

  function queueRecordUpdate(recordId: string, task: () => Promise<void>) {
    const previous = recordUpdateQueue.get(recordId) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(task)
      .finally(() => {
        if (recordUpdateQueue.get(recordId) === next) {
          recordUpdateQueue.delete(recordId);
        }
      });
    recordUpdateQueue.set(recordId, next);
    return next;
  }

  function onUpdateCell(payload: { recordId: string; revision: number; fieldId: string; type: string; value: any }) {
    const { recordId, fieldId, value } = payload;

    const record = work.records.find((item) => item.id === recordId);
    if (!record) return;

    const oldValue = record.data[fieldId];

    if (isEqual(oldValue, value)) {
      return;
    }

    record.data[fieldId] = value;

    queueRecordUpdate(recordId, async () => {
      const current = work.records.find((item) => item.id === recordId);
      if (!current) return;
      try {
        await work.patchRecord(recordId, current.revision, { [fieldId]: value });
      } catch (e: any) {
        if (e?.response?.status === 409) {
          toast.add({ severity: 'error', summary: '更新冲突', detail: '数据已更新，请刷新后重试' });
          await reload();
          return;
        }
        toast.add({ severity: 'error', summary: '更新失败', detail: e?.response?.data?.message ?? '更新失败' });
      }
    });
  }

  // Attachment Preview
  function showAttachmentPreview(event: Event, file: any) {
    clearHideTimer();
    previewFile.value = file;
    attachmentPreviewPopover.value.show(event);
  }

  function hideAttachmentPreview() {
    hideTimer.value = window.setTimeout(() => {
      attachmentPreviewPopover.value.hide();
    }, 100);
  }

  function clearHideTimer() {
    if (hideTimer.value) {
      clearTimeout(hideTimer.value);
      hideTimer.value = null;
    }
  }

  return {
    loading,
    editingRowId,
    reload,
    createRecord,
    deleteRecord,
    insertRows,
    onCellEditInit,
    onCellEditComplete,
    onCellEditCancel,
    onUpdateCell,
    
    attachmentPreviewPopover,
    previewFile,
    showAttachmentPreview,
    hideAttachmentPreview,
    clearHideTimer,
  };
}
