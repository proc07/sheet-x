<template>
  <div class="flex h-full min-h-0 flex-col ">
    <TableToolbar
      :fields="work.fields"
      :row-height="rowHeight"
      :loading="loading"
      @update:row-height="selectRowHeight"
      @create-record="createRecord"
      @toggle-field-visibility="toggleFieldVisibility"
      @open-field-create="openFieldCreateFromConfig"
      @edit-field="openFieldEdit"
      @delete-field="handleDeleteField"
      @reorder-fields="handleReorderFields"
    />

    <div
      ref="tableWrap"
      class="flex min-h-10 flex-1 flex-col overflow-hidden"
    >
      <DataTable
        ref="dataTable"
        :key="rowHeight"
        class="w-full table-row-select"
        scrollable
        showGridlines
        resizableColumns
        dataKey="id"
        columnResizeMode="expand"
        :virtualScrollerOptions="virtualScrollerOptions"
        :tableStyle="{ tableLayout: 'fixed' }"
        :loading="loading"
        size="small"
        v-model:selection="selectedRows"
        :rowClass="getRowClass"
        :rowStyle="getRowStyle"
        contextMenu
        v-model:contextMenuSelection="contextMenuRow"
        :scrollHeight="tableHeight ? tableHeight : 'flex'"
        editMode="cell"
        @cell-edit-init="onCellEditInit"
        @cell-edit-complete="onCellEditComplete"
        @cell-edit-cancel="onCellEditCancel"
        @select-all-change="onSelectAllChange"
        @row-contextmenu="onRowContextMenu"
        @column-resize-end="onColumnResizeEnd"
        :value="work.records"        
        :reorderableColumns="true"
        @columnReorder="onColReorder"
        @rowReorder="onRowReorder"
      >
        <template #empty>
          <div class="flex items-center justify-center py-8 text-sm text-slate-400">
            {{ loading ? '加载中...' : '暂无记录，点击上方“添加记录”按钮创建新记录' }}
          </div>
        </template>
        <!-- <Column
          rowReorder
          headerClass="row-handle-cell"
          bodyClass="row-handle-cell"
          :headerStyle="{ width: '3rem', minWidth: '3rem', maxWidth: '3rem', textAlign: 'center' }"
          :bodyStyle="{ width: '3rem', minWidth: '3rem', maxWidth: '3rem', textAlign: 'center' }"
          :reorderableColumn="false"
        /> -->
        <Column
          :reorderableColumn="false"
          columnKey="row-select"
          selectionMode="multiple"
          frozen
          headerClass="row-select-cell"
          bodyClass="row-select-cell"
          :headerStyle="{ width: '40px', padding: '10px' }"
          :bodyStyle="{ width: '40px', textAlign: 'center' }"
        ></Column>
        <Column
          v-for="field in visibleFields"
          :key="field.id"
          :columnKey="field.id"
          :field="`${field.id}`"
          :style="{ minWidth: `${DEFAULT_FIELD_WIDTH}px`, width: `${getFieldWidth(field)}px`}"
          headerClass="field-cell"
          bodyClass="field-cell"
          :pt="{ headerCell: { 'data-field-id': field.id } }"
        >
          <template #header>
            <div class="flex items-center gap-1 w-full">
              <i class="pi text-slate-400 text-xs mr-1" :class="getFieldTypeIcon(field.type)"></i>
              <span class="truncate">{{ field.name }}</span>
            </div>
          </template>
          <template #body="{ data }">
            <div class="w-full whitespace-normal overflow-hidden text-ellipsis" :class="`line-clamp-${rowHeight}`" :style="{ height: `${rowHeight * HEIGHT_PER_ROW}px` }">
              {{ data.data?.[field.id] }}
            </div>
          </template>
          <template #editor="{ data }">
            <div class="w-full whitespace-normal overflow-hidden text-ellipsis" :class="`line-clamp-${rowHeight}`" :style="{ height: `${rowHeight * HEIGHT_PER_ROW}px` }">
              <CellEditor
                :field="field"
                :record="data"
                @update="onUpdateCell"
              />
            </div>
          </template>
        </Column>
        <Column 
          columnKey="field-add"
          :style="{ width: hasHorizontalScroll ?  DEFAULT_FIELD_WIDTH + 'px' : 'auto' }"
          :reorderableColumn="false"
        >
          <template #header>
            <Button
              icon="pi pi-plus"
              text
              rounded
              size="small"
              aria-label="新增字段"
              @click="toggleFieldCreatePopover"
            />
          </template>
        </Column>

        <ColumnGroup type="footer">
          <Row>
            <Column
              :colspan="2"
              :footer="`${work.records.length}条记录`"
              footer-style="text-align: right; font-size: 12px; color: #6b7280;"
            />
            <Column
              v-for="(field, index) in visibleFields"
              :key="`footer-${field.id}`"
              footer-style="text-align: right; font-size: 12px; color: #6b7280; cursor: pointer;"
            >
              <template #footer>
                 <div v-show="index !== visibleFields.length - 1" @click="openStatPopover($event, field.id)" class="hover:bg-slate-100 py-1 rounded flex items-center justify-end gap-1 group">
                   <span>{{ getStatLabel(field.id) }}</span>
                   <i 
                    class="pi text-slate-400 group-hover:text-slate-600 !text-[12px]"
                    :class="currentStatFieldId === field.id && statPopoverVisible ? 'pi-sort-up-fill' : 'pi-sort-down-fill'"
                   ></i>
                 </div>
               </template>
             </Column>
           </Row>
         </ColumnGroup>
       </DataTable>
 
       <Popover ref="statPopover" @show="statPopoverVisible = true" @hide="statPopoverVisible = false">
         <div class="w-32 py-1">
          <button
            v-for="opt in statOptions"
            :key="opt.value"
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            @click="selectStat(opt.value)"
          >
            <span>{{ opt.label }}</span>
            <i v-if="fieldStats[currentStatFieldId!]?.type === opt.value" class="pi pi-check ml-auto text-blue-600 text-xs"></i>
          </button>
        </div>
      </Popover>

      <ContextMenu ref="rowMenu" :model="rowMenuItems" class="w-72">
        <template #item="{ item, props }">
          <div
            v-if="item.type === 'insert'"
            v-bind="props.action"
            :class="['flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700', item.class, item.disabled ? 'opacity-50 pointer-events-none' : '']"
          >
            <i v-bind="props.icon" :class="item.icon"></i>
            <span v-bind="props.label">{{ item.label }}</span>
            <InputNumber
              :min="1"
              :max="100"
              :disabled="(item.disabled as boolean)"
              inputClass="w-12 h-5 text-center text-sm"
              class="w-14"
              size="small"
              :modelValue="getInsertCount(item.direction)"
              @input="(event) => onInsertInput(item.direction, event)"
              @update:modelValue="(val) => setInsertCount(item.direction, val)"
              @click.stop
              @mousedown.stop
              @keydown.stop
            />
            <span class="text-slate-500">行</span>
          </div>
          <div
            v-else
            v-bind="props.action"
            :class="['flex items-center gap-3 px-3 py-2 text-sm text-slate-700', item.class, item.disabled ? 'opacity-50 pointer-events-none' : '']"
          >
            <i v-bind="props.icon" :class="item.icon" class="text-slate-500"></i>
            <span v-bind="props.label">{{ item.label }}</span>
          </div>
        </template>
      </ContextMenu>

      <Dialog v-model:visible="fieldCreateVisible" :draggable="false" modal header="新增字段" class="min-w-[320px]">
        <FieldCreateForm
          :tableId="resolvedTableId"
          :initialName="currentEditField?.name"
          :initialType="currentEditField?.type"
          :initialOptions="currentEditField?.options"
          @submit="handleFieldCreateSubmit"
          @cancel="closeFieldCreatePopover"
        />
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type {
  DataTableRowContextMenuEvent,
  DataTableRowReorderEvent,
  DataTableColumnReorderEvent,
  DataTableColumnResizeEndEvent,
  DataTableCellEditInitEvent,
  DataTableCellEditCancelEvent,
  DataTableCellEditCompleteEvent,
  DataTableSelectAllChangeEvent,
} from 'primevue/datatable';
import type { InputNumberInputEvent } from 'primevue/inputnumber';
import type { MenuItem } from 'primevue/menuitem';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { api, getBatchTableStats } from '../api';
import { useWorkStore, type Field, type RecordRow } from '../stores/work';
import CellEditor from '../components/CellEditor.vue';
import TableToolbar from '../components/TableToolbar.vue';
import {
  ROW_PADDING,
  DEFAULT_FIELD_WIDTH,
  HEIGHT_PER_ROW, 
  rowHeightOptions, 
  statOptions, 
  fieldTypeMeta,
} from '../constants/table';
import FieldCreateForm from '../components/FieldCreateForm.vue';

const props = defineProps<{ tableId?: string }>();

const route = useRoute();
const router = useRouter();
const work = useWorkStore();
const toast = useToast();
const confirm = useConfirm();

function getFieldTypeIcon(type: Field['type']) {
  return fieldTypeMeta[type]?.icon ?? 'pi-question';
}

const resolvedTableId = computed(() => props.tableId ?? (route.params.tableId as string) ?? '');

const fieldCreateVisible = ref(false);
const fieldEditId = ref<string | null>(null);
const currentEditField = computed(() => {
  if (!fieldEditId.value) return null;
  return work.fields.find((f) => f.id === fieldEditId.value);
});

async function handleFieldCreateSubmit(payload: { name: string; type: Field['type']; options: any }) {
  const tableId = resolvedTableId.value;
  if (!tableId) return;
  
  if (fieldEditId.value) {
    try {
      await work.updateField(tableId, fieldEditId.value, {
        name: payload.name,
        type: payload.type,
        options: payload.options
      });
      toast.add({ severity: 'success', summary: '更新成功', life: 3000 });
    } catch (e) {
      toast.add({ severity: 'error', summary: '更新失败', life: 3000 });
    }
  } else {
    await work.createField(tableId, { 
      name: payload.name, 
      type: payload.type, 
      options: payload.options 
    });
  }
  closeFieldCreatePopover();
}

function toggleFieldCreatePopover(event: MouseEvent, anchor?: HTMLElement) {
  fieldEditId.value = null;
  fieldCreateVisible.value = true;
}

function closeFieldCreatePopover() {
  fieldCreateVisible.value = false;
}

function openFieldEdit(field: Field) {
  fieldEditId.value = field.id;
  fieldCreateVisible.value = true;
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
      const tableId = resolvedTableId.value;
      if (!tableId) return;
      try {
        await work.deleteField(tableId, field.id);
        toast.add({ severity: 'success', summary: '删除成功', life: 3000 });
      } catch (e) {
        toast.add({ severity: 'error', summary: '删除失败', life: 3000 });
      }
    }
  });
}

async function handleReorderFields(newFields: Field[]) {
  const tableId = resolvedTableId.value;
  if (!tableId) return;

  // Optimistic update locally
  work.fields = newFields;
  
  // We should re-assign position in local objects too to be consistent
  newFields.forEach((f, i) => f.position = i);

  try {
    await work.updateFieldLayout(tableId, newFields.map((f, i) => ({ id: f.id, position: i })));
  } catch (e) {
    console.error('Failed to reorder fields', e);
    toast.add({ severity: 'error', summary: '排序失败', life: 3000 });
    // Revert? (requires reloading or keeping backup)
    await work.loadFields(tableId);
  }
}

const fieldConfigContent = ref<HTMLElement | null>(null);
const fieldConfigListMaxHeight = ref(320);

const recordUpdateQueue = new Map<string, Promise<void>>();
const editingRowId = ref<string | null>(null);
const selectedRows = ref<RecordRow[]>([]);

const recordIndexMap = computed(() => {
  const map = new Map<string, number>();
  work.records.forEach((record, index) => {
    map.set(record.id, index);
  });
  return map;
});

const selectedRowIds = computed(() => new Set(selectedRows.value.map((row) => row.id)));
const visibleFields = computed(() => work.fields.filter((field) => !field.options?.hidden));

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


// Stats related
const fieldStats = ref<Record<string, { type: string; value: string | number; loading: boolean }>>({});
const statPopover = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null);
const currentStatFieldId = ref<string | null>(null);
const statPopoverVisible = ref(false);

function getStatLabel(fieldId: string) {
  const stat = fieldStats.value[fieldId];
  if (!stat || stat.type === 'none') return '选择计算';
  if (stat.loading) return '计算中...';

  const val = stat.value;
  switch (stat.type) {
    case 'countAll': return `${val}条记录`;
    case 'empty': return `未填写 ${val}`;
    case 'filled': return `已填写 ${val}`;
    case 'percentEmpty': return `未填写占比 ${Number(val).toFixed(1)}%`;
    case 'percentFilled': return `已填写占比 ${Number(val).toFixed(1)}%`;
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

  if (type === 'none') {
    fieldStats.value[fieldId] = { type, value: 0, loading: false };
    // Persist changes
    await work.updateFieldLayout(resolvedTableId.value, [{ id: fieldId, statType: 'none' }]);
    return;
  }

  fieldStats.value[fieldId] = { 
    type, 
    value: fieldStats.value[fieldId]?.value ?? 0, 
    loading: true 
  };

  // Persist changes
  work.updateFieldLayout(resolvedTableId.value, [{ id: fieldId, statType: type }]);

  try {
    const res = await getBatchTableStats(resolvedTableId.value, [{ fieldId, type }]);
    if (res.length > 0) {
      fieldStats.value[fieldId] = { type: res[0].type, value: res[0].value, loading: false };
    }
  } catch (e) {
    console.error(e);
    toast.add({ severity: 'error', summary: '获取统计失败', detail: '请重试', life: 3000 });
    fieldStats.value[fieldId] = { type: 'none', value: 0, loading: false };
  }
}

// Initialize stats from field options
watch(() => work.fields, async (fields) => {
  const requests: { fieldId: string; type: string }[] = [];
  
  fields.forEach((field) => {
    const statType = field.options?.statType;
    // Skip if already loaded or no stat type
    if (!statType || statType === 'none' || fieldStats.value[field.id]) return;

    fieldStats.value[field.id] = { type: statType, value: 0, loading: true };
    requests.push({ fieldId: field.id, type: statType });
  });

  if (requests.length === 0) return;

  try {
    const res = await getBatchTableStats(resolvedTableId.value, requests);
    res.forEach((stat) => {
      fieldStats.value[stat.fieldId] = { type: stat.type, value: stat.value, loading: false };
    });
  } catch (e) {
    console.error(e);
    // On batch error, reset all requested fields to none/error state
    requests.forEach((req) => {
      fieldStats.value[req.fieldId] = { type: 'none', value: 0, loading: false };
    });
  }
}, { immediate: true, deep: true });

const rowHeight = ref<typeof rowHeightOptions[number]['value']>(rowHeightOptions[0].value);
const virtualScrollerOptions = computed(() => ({
  itemSize: ROW_PADDING + rowHeight.value * HEIGHT_PER_ROW,
  delay: 0,
  numToleratedItems: 20,
}));
const hasHorizontalScroll = ref(false);

function normalizeRowHeight(value?: number) {
  return value === 1 || value === 2 || value === 4 || value === 6 ? value : 1;
}

function updateHorizontalScroll() {
  const container = tableWrap.value?.querySelector('.p-datatable-table-container')?.childNodes?.[0] as HTMLElement | null;
  if (!container) return;
  const next = container.scrollWidth > container.clientWidth;
  if (next !== hasHorizontalScroll.value) {
    hasHorizontalScroll.value = next;
  }
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

function isFieldHidden(field: Field) {
  return Boolean(field.options?.hidden);
}

async function toggleFieldVisibility(field: Field) {
  const tableId = resolvedTableId.value;
  if (!tableId) return;
  const nextHidden = !isFieldHidden(field);
  const previousOptions = field.options ?? {};
  field.options = { ...previousOptions, hidden: nextHidden };
  try {
    await work.updateFieldLayout(tableId, [{ id: field.id, hidden: nextHidden }]);
    nextTick(updateHorizontalScroll);
  } catch (e: any) {
    field.options = previousOptions;
    showUpdateErrorToast(e?.response?.data?.message ?? '更新字段显示状态失败');
  }
}

function openFieldCreateFromConfig(event: MouseEvent, anchor?: HTMLElement) {
  toggleFieldCreatePopover(event, anchor);
}

function getRowClass(data: RecordRow) {
  return {
    'row-editing': editingRowId.value === data.id,
    'row-selected': selectedRowIds.value.has(data.id),
  };
}

function getRowStyle(data: RecordRow) {
  const index = recordIndexMap.value.get(data.id);
  const label = index !== undefined ? String(index + 1) : '';
  return { '--row-index': `"${label}"` };
}

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

function onSelectAllChange(event: DataTableSelectAllChangeEvent) {
  selectedRows.value = event.checked ? [...work.records] : [];
}

const dataTable = ref<any>(null);

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

  const tableId = resolvedTableId.value;
  if (!tableId) return;

  work.updateTable(tableId, { rowHeight: value }).catch((e: any) => {
    const message = e?.response?.data?.message ?? '保存行高失败';
    showUpdateErrorToast(message);
    rowHeight.value = previous;
  });
}

function getFieldWidth(field: Field) {
  const width = field.options?.width;
  if (typeof width === 'number' && Number.isFinite(width)) {
    return Math.max(DEFAULT_FIELD_WIDTH, Math.round(width));
  }
  return DEFAULT_FIELD_WIDTH;
}

function getFieldOrderFromDom() {
  const container = tableWrap.value;
  if (!container) return [];
  // Read the actual header order after drag/reorder.
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

function showUpdateErrorToast(detail: string, summary = '更新失败') {
  toast.add({
    severity: 'error',
    summary,
    detail,
    life: 3000,
  });
}

async function persistFieldLayout(updates: Array<{ id: string; position?: number; width?: number; hidden?: boolean }>) {
  const tableId = resolvedTableId.value;
  if (!tableId || updates.length === 0) return;
  try {
    // Persist layout to backend so refresh keeps the state.
    await work.updateFieldLayout(tableId, updates);
  } catch (error) {
    console.error('Failed to update field layout', error);
  }
}

// drag and drop
const onColReorder = async (_event: DataTableColumnReorderEvent) => {
  await nextTick();
  const orderIds = getFieldOrderFromDom();
  if (orderIds.length === 0) return;

  // Sync store order with UI order, then persist positions.
  const fieldMap = new Map(work.fields.map((field) => [field.id, field]));
  const orderedVisible = orderIds.map((id) => fieldMap.get(id)).filter(Boolean) as Field[];
  const visibleCount = work.fields.filter((field) => !field.options?.hidden).length;
  if (orderedVisible.length !== visibleCount) return;

  const orderedFields: Field[] = [];
  let visibleIndex = 0;
  for (const field of work.fields) {
    if (field.options?.hidden) {
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
  nextTick(updateHorizontalScroll);
};

const onColumnResizeEnd = async (event: DataTableColumnResizeEndEvent) => {
  const header = event.element as HTMLElement | undefined;
  const fieldId = header?.dataset?.fieldId;
  if (!fieldId) return;
  const field = work.fields.find((item) => item.id === fieldId);
  if (!field) return;
  // Use the actual header width so resize is saved as the user sees it.
  const width = Math.max(100, Math.round(header.getBoundingClientRect().width));
  const currentWidth = field.options?.width;
  if (currentWidth === width) return;
  field.options = { ...(field.options ?? {}), width };
  await persistFieldLayout([{ id: fieldId, width }]);
  nextTick(updateHorizontalScroll);
};
const onRowReorder = (event: DataTableRowReorderEvent) => {
  console.log('row reorder', event);
  work.records = event.value;
};

const loading = ref(false);
const tableWrap = ref<HTMLDivElement | null>(null);
const tableHeight = ref('');

const updateTableHeight = () => {
  const el = tableWrap.value;
  if (!el) return;
  const { top } = el.getBoundingClientRect();
  const height = Math.max(0, window.innerHeight - top);
  const nextHeight = `${Math.floor(height)}px`;
  if (tableHeight.value !== nextHeight) {
    tableHeight.value = nextHeight;
  }
  nextTick(updateHorizontalScroll);
};

const handleWindowResize = () => {
  updateTableHeight();
  updateFieldConfigMaxHeight();
};

const handleWindowScroll = () => {
  updateFieldConfigMaxHeight();
};

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

const rowMenu = ref<{ show: (event: Event) => void; hide: () => void } | null>(null);
const contextMenuRow = ref<RecordRow | null>(null);
const insertAboveCount = ref(1);
const insertBelowCount = ref(1);
const rowMenuItems = computed<MenuItem[]>(() => {
  const disabled = !contextMenuRow.value;
  return [
    { label: '向上插入', icon: 'pi pi-arrow-up', type: 'insert', direction: 'above', command: () => insertRows('above'), disabled },
    { label: '向下插入', icon: 'pi pi-arrow-down', type: 'insert', direction: 'below', command: () => insertRows('below'), disabled },
    { separator: true },
    { label: '查看详情', icon: 'pi pi-info-circle', command: () => handleMenuAction('查看详情'), disabled },
    { label: '添加子记录', icon: 'pi pi-sitemap', command: () => handleMenuAction('添加子记录'), disabled },
    { label: '查看记录历史', icon: 'pi pi-history', command: () => handleMenuAction('查看记录历史'), disabled },
    { label: '添加评论', icon: 'pi pi-comment', command: () => handleMenuAction('添加评论'), disabled },
    { separator: true },
    { label: '删除记录', icon: 'pi pi-trash', class: 'text-red-500', command: () => deleteContextRow(), disabled },
  ];
});

function onRowContextMenu(event: DataTableRowContextMenuEvent) {
  event.originalEvent.preventDefault();
  insertAboveCount.value = 1;
  insertBelowCount.value = 1;
  contextMenuRow.value = event.data ?? null;
  rowMenu.value?.show(event.originalEvent);
}

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

// todo: optimize batch insert
async function insertRows(direction: 'above' | 'below') {
  const tableId = resolvedTableId.value;
  const anchor = contextMenuRow.value;
  if (!tableId || !anchor) return;
  const count = normalizeInsertCount(getInsertCount(direction));
  if (count < 1) return;
  const anchorIndex = work.records.findIndex((record) => record.id === anchor.id);
  if (anchorIndex < 0) return;
  const insertIndex = direction === 'above' ? anchorIndex : anchorIndex + 1;

  try {
    const created: RecordRow[] = [];
    for (let i = 0; i < count; i += 1) {
      const { data } = await api.post('/records', { tableId, data: {} });
      created.push(data as RecordRow);
    }
    work.records.splice(insertIndex, 0, ...created);
    rowMenu.value?.hide?.();
  } catch (e: any) {
    showUpdateErrorToast(e?.response?.data?.message ?? '插入记录失败');
  }
}

function handleMenuAction(label: string) {
  if (!contextMenuRow.value) return;
  console.info(`[Table] ${label}`, contextMenuRow.value);
}

async function deleteContextRow() {
  const target = contextMenuRow.value;
  if (!target) return;
  await remove(target.id);
  contextMenuRow.value = null;
  rowMenu.value?.hide?.();
}

watch(
  () => resolvedTableId.value,
  async (tableId) => {
    if (!tableId) return;
    await reload();
  },
  { immediate: true }
);

async function reload() {
  const tableId = resolvedTableId.value;
  if (!tableId) return;
  loading.value = true;
  try {
    const table = await work.loadTable(tableId);
    if (table?.rowHeight !== undefined) {
      rowHeight.value = normalizeRowHeight(table.rowHeight);
    }
    await work.loadFields(tableId);
    await work.loadRecords(tableId);
    nextTick(updateHorizontalScroll);
  } catch (e: any) {
    showUpdateErrorToast(e?.response?.data?.message ?? '加载失败');
  } finally {
    loading.value = false;
  }
}

async function createRecord() {
  const tableId = resolvedTableId.value;
  if (!tableId) return;
  await work.createRecord(tableId);
}

function onUpdateCell(payload: { recordId: string; revision: number; fieldId: string; value: any }) {
  const { recordId, fieldId, value } = payload;
  const record = work.records.find((item) => item.id === recordId);
  if (!record) return;
  if (typeof value === 'string' && value.trim().length === 0) {
    return;
  }
  if (!record.data) {
    record.data = {};
  }
  if (Object.is(record.data[fieldId], value)) {
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
        showUpdateErrorToast('数据已更新，请刷新后重试', '更新冲突');
        await reload();
        return;
      }
      showUpdateErrorToast(e?.response?.data?.message ?? '更新失败');
    }
  });
}

async function remove(recordId: string) {
  await work.deleteRecord(recordId);
}
</script>

<style scoped>
:deep(.table-row-select .p-datatable-tbody > tr.row-editing > td),
:deep(.table-row-select .p-datatable-tbody > tr.row-selected > td),
:deep(.table-row-select .p-datatable-tbody > tr.p-datatable-row-selected > td) {
  background-color: #cbd5e1!important;
}
:deep(.table-row-select .p-datatable-tbody > tr:hover > td) {
  background-color: #f1f5f9;
}

.field-type-text {
  min-width: 28px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

.field-type-icon {
  min-width: 28px;
  text-align: center;
  color: #64748b;
}

.field-config-scroll {
  overflow-y: auto;
}

.field-config-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.field-config-scroll::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 9999px;
}

.field-config-scroll::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.table-row-select .p-datatable-tbody > tr > td.row-select-cell) {
  position: relative;
}

:deep(.table-row-select .p-datatable-tbody > tr > td.row-select-cell::before) {
  content: var(--row-index, counter(row));
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 12px;
}

:deep(.table-row-select .p-datatable-tbody > tr:hover > td.row-select-cell::before),
:deep(.table-row-select .p-datatable-tbody > tr.row-selected > td.row-select-cell::before),
:deep(.table-row-select .p-datatable-tbody > tr.p-datatable-row-selected > td.row-select-cell::before) {
  opacity: 0;
}

:deep(.table-row-select .p-datatable-tbody > tr > td.row-select-cell .p-checkbox) {
  opacity: 0;
  pointer-events: none;
}

:deep(.table-row-select .p-datatable-tbody > tr:hover > td.row-select-cell .p-checkbox),
:deep(.table-row-select .p-datatable-tbody > tr.row-selected > td.row-select-cell .p-checkbox),
:deep(.table-row-select .p-datatable-tbody > tr.p-datatable-row-selected > td.row-select-cell .p-checkbox) {
  opacity: 1;
  pointer-events: auto;
}
</style>
