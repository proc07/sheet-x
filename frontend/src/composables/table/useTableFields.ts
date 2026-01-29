import { ref, computed, nextTick, watch, type Ref } from 'vue';
import type { MenuItem } from 'primevue/menuitem';
import type { DataTableColumnResizeEndEvent } from 'primevue/datatable';
import type { Field } from '../../types/table';
import { useWorkStore } from '../../stores/work';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { DEFAULT_FIELD_WIDTH } from '../../constants/table';

interface TableFieldsCallbacks {
  onLayoutUpdate?: () => void;
}

export function useTableFields(tableId: Ref<string>, callbacks?: TableFieldsCallbacks) {
  const work = useWorkStore();
  const toast = useToast();
  const confirm = useConfirm();

  // Field Menu
  const fieldMenu = ref();
  const fieldMenuVisible = ref(false);
  const fieldMenuContext = ref<{ field: Field; index: number } | null>(null);

  // Field Create/Edit
  const fieldCreateVisible = ref(false);
  const fieldEditId = ref<string | null>(null);
  
  const currentEditField = computed(() => {
    if (!fieldEditId.value) return null;
    return work.fields.find((f) => f.id === fieldEditId.value);
  });

  const visibleFields = computed(() => work.fields.filter((field) => !field.hidden));

  // --- Actions ---

  async function persistFieldLayout(updates: Array<{ id: string; position?: number; width?: number; hidden?: boolean; frozen?: boolean }>) {
    if (!tableId.value || updates.length === 0) return;
    try {
      await work.updateFieldLayout(tableId.value, updates);
    } catch (error) {
      console.error('Failed to update field layout', error);
    }
  }

  function handleFreezeColumn(field: Field) {
    const currentFrozen = !!field.frozen;
    const nextFrozen = !currentFrozen;
    field.frozen = nextFrozen;
    persistFieldLayout([{ id: field.id, frozen: nextFrozen }]);
  }

  function handleDeleteField(field: Field) {
    confirm.require({
      message: `确定要删除字段 "${field.name}" 吗？此操作不可恢复。`,
      header: '删除确认',
      icon: 'pi pi-exclamation-triangle',
      rejectClass: 'p-button-secondary',
      rejectLabel: '取消',
      acceptClass: 'p-button-danger',
      acceptLabel: '删除',
      accept: async () => {
        if (!tableId.value) return;
        try {
          await work.deleteField(tableId.value, field.id);
          toast.add({ severity: 'success', summary: '删除成功', life: 3000 });
          callbacks?.onLayoutUpdate?.();
        } catch (e) {
          toast.add({ severity: 'error', summary: '删除失败', life: 3000 });
        }
      }
    });
  }

  function openFieldMenu(event: MouseEvent, field: Field, index: number) {
    fieldMenuContext.value = { field, index };
    fieldMenuVisible.value = true;
    fieldMenu.value.show(event);
  }

  // Hack to track menu visibility for active state
  watch(() => fieldMenu.value?.visible, (val) => {
    fieldMenuVisible.value = !!val;
  });

  const fieldMenuItems = computed<MenuItem[]>(() => {
    if (!fieldMenuContext.value) return [];
    const { field } = fieldMenuContext.value;
    const isFrozen = !!field.frozen;
    
    return [
      { label: '修改字段/列', icon: 'pi pi-pencil', command: () => openFieldEdit(field) },
      { label: '编辑字段/列描述', icon: 'pi pi-info-circle', disabled: true },
      { separator: true },
      { label: '隐藏字段', icon: 'pi pi-eye-slash', command: () => toggleFieldVisibility(field) },
      { separator: true },
      { label: '向左插入字段/列', icon: 'pi pi-arrow-left', disabled: true },
      { label: '向右插入字段/列', icon: 'pi pi-arrow-right', disabled: true },
      { label: isFrozen ? '取消冻结' : '冻结字段/列', icon: 'pi pi-pause', command: () => handleFreezeColumn(field) },
      { separator: true },
      { label: '按 A 到 Z 排序', icon: 'pi pi-sort-alpha-down', disabled: true },
      { label: '按 Z 到 A 排序', icon: 'pi pi-sort-alpha-up', disabled: true },
      { separator: true },
      { label: '删除字段/列', icon: 'pi pi-trash', class: 'text-red-500', command: () => handleDeleteField(field) },
    ];
  });

  function openFieldEdit(field: Field) {
    fieldEditId.value = field.id;
    fieldCreateVisible.value = true;
  }

  function toggleFieldCreatePopover(event?: MouseEvent, anchor?: HTMLElement) {
    fieldEditId.value = null;
    fieldCreateVisible.value = true;
  }

  function closeFieldCreatePopover() {
    fieldCreateVisible.value = false;
  }

  function openFieldCreateFromConfig(event: MouseEvent, anchor?: HTMLElement) {
    toggleFieldCreatePopover(event, anchor);
  }

  async function handleFieldCreateSubmit(payload: { name: string; type: Field['type']; options: any }) {
    if (!tableId.value) return;
    
    if (fieldEditId.value) {
      try {
        await work.updateField(tableId.value, fieldEditId.value, {
          name: payload.name,
          type: payload.type,
          config: payload.options
        });
        toast.add({ severity: 'success', summary: '更新成功', life: 3000 });
      } catch (e) {
        toast.add({ severity: 'error', summary: '更新失败', life: 3000 });
      }
    } else {
      await work.createField(tableId.value, { 
        name: payload.name, 
        type: payload.type, 
        config: payload.options 
      });
    }
    closeFieldCreatePopover();
    callbacks?.onLayoutUpdate?.();
  }

  function isFieldHidden(field: Field) {
    return Boolean(field.hidden);
  }

  async function toggleFieldVisibility(field: Field) {
    if (!tableId.value) return;
    const nextHidden = !isFieldHidden(field);
    field.hidden = nextHidden;
    try {
      await work.updateFieldLayout(tableId.value, [{ id: field.id, hidden: nextHidden }]);
      callbacks?.onLayoutUpdate?.();
    } catch (e: any) {
      field.hidden = !nextHidden;
      toast.add({ severity: 'error', summary: '更新失败', detail: e?.response?.data?.message ?? '更新字段显示状态失败' });
    }
  }

  function getFieldWidth(field: Field) {
    const width = field.width;
    if (typeof width === 'number' && Number.isFinite(width)) {
      return Math.max(DEFAULT_FIELD_WIDTH, Math.round(width));
    }
    return DEFAULT_FIELD_WIDTH;
  }

  // Drag and Drop Logic
  
  // Helper to get order from DOM
  function _getFieldOrderFromDom(container: HTMLElement) {
    const headers = Array.from(container.querySelectorAll<HTMLElement>('th[data-field-id]'));
    const ids: string[] = [];
    for (const header of headers) {
      const fieldId = header.dataset.fieldId;
      if (fieldId && !ids.includes(fieldId)) {
        ids.push(fieldId);
      }
    }
    return ids;
  }

  async function handleReorderFields(newFields: Field[]) {
    if (!tableId.value) return;
    work.fields = newFields;
    // 重新分配对象的位置以保持一致
    newFields.forEach((f, i) => f.position = i);

    try {
      await work.updateFieldLayout(tableId.value, newFields.map((f, i) => ({ id: f.id, position: i })));
      callbacks?.onLayoutUpdate?.();
    } catch (e) {
      console.error('Failed to reorder fields', e);
      toast.add({ severity: 'error', summary: '排序失败', life: 3000 });
      await work.loadFields(tableId.value);
    }
  }

  // 处理列排序事件
  const onColReorder = async (tableWrap: HTMLElement | null) => {
    await nextTick();
    if (!tableWrap) return;
    const orderIds = _getFieldOrderFromDom(tableWrap);
    if (orderIds.length === 0) return;

    // work.fields 包含了 显示 和 隐藏 的所有字段。
    const fieldMap = new Map(work.fields.map((field) => [field.id, field]));
    const orderedVisible = orderIds.map((id) => fieldMap.get(id)).filter(Boolean) as Field[];
    const visibleCount = work.fields.filter((field) => !field.hidden).length;
    if (orderedVisible.length !== visibleCount) return;

    const orderedFields: Field[] = [];
    let visibleIndex = 0;
    for (const field of work.fields) {
      if (field.hidden) {
        orderedFields.push(field);
      } else {
        orderedFields.push(orderedVisible[visibleIndex]);
        visibleIndex += 1;
      }
    }
    if (orderedFields.length !== work.fields.length) return;

    orderedFields.forEach((field, index) => {
      field.position = index;
    });
    work.fields = orderedFields;
    await persistFieldLayout(
      orderedFields.map((field, index) => ({ id: field.id, position: index }))
    );
    callbacks?.onLayoutUpdate?.();
  };

  const onColumnResizeEnd = async (event: DataTableColumnResizeEndEvent) => {
    const header = event.element as HTMLElement | undefined;
    const fieldId = header?.dataset?.fieldId;
    if (!fieldId) return;
    const field = work.fields.find((item) => item.id === fieldId);
    if (!field) return;
    const width = Math.max(100, Math.round(header.getBoundingClientRect().width));
    const currentWidth = field.width;
    if (currentWidth === width) return;
    field.width = width;
    await persistFieldLayout([{ id: fieldId, width }]);
    callbacks?.onLayoutUpdate?.();
  };

  return {
    fieldMenu,
    fieldMenuVisible,
    fieldMenuContext,
    fieldMenuItems,
    openFieldMenu,
    
    fieldCreateVisible,
    currentEditField,
    handleFieldCreateSubmit,
    toggleFieldCreatePopover,
    closeFieldCreatePopover,
    openFieldCreateFromConfig,
    openFieldEdit,
    
    visibleFields,
    handleDeleteField,
    handleReorderFields,
    toggleFieldVisibility,
    
    getFieldWidth,
    onColReorder,
    onColumnResizeEnd,
  };
}
