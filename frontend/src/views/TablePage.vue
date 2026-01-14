<template>
  <div class="flex h-full min-h-0 flex-col ">
    <div class="overflow-hidden shrink-0">
      <div class="flex flex-wrap items-center gap-2 py-2 text-sm">
        <button
          v-for="action in toolbarActions"
          :key="action.label"
          type="button"
          class="flex items-center gap-2 rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
          @click="action.action?.($event)"
        >
          <i :class="action.icon"></i>
          <span>{{ action.label }}</span>
        </button>
      </div>

      <Popover ref="rowHeightPopover">
        <div class="w-35">
          <div class="px-2 pt-2 text-sm text-slate-400">设置行高</div>
          <div class="pt-1">
            <button
              v-for="option in rowHeightOptions"
              :key="option.value"
              type="button"
              class="flex w-full items-center gap-2 px-2 py-2 text-sm transition hover:bg-slate-100"
              :class="rowHeight === option.value ? 'text-blue-600' : 'text-slate-600'"
              @click="selectRowHeight(option.value)"
            >
              <i class="pi" :class="option.iconClass"></i>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>
      </Popover>

      <Popover ref="fieldConfigPopover">
        <div ref="fieldConfigContent" class="w-72">
          <div ref="fieldConfigHeader" class="flex items-center gap-2 border-b border-slate-200/80 px-3 py-2 text-sm font-medium text-slate-700">
            <span>字段配置</span>
            <i class="pi pi-question-circle text-slate-400"></i>
          </div>
          <ScrollPanel class="field-config-scroll" :style="{ maxHeight: `${fieldConfigListMaxHeight}px` }">
            <div class="py-1">
              <div
                v-for="field in work.fields"
                :key="`config-${field.id}`"
                class="flex items-center justify-between gap-2 px-2 py-2 text-sm transition hover:bg-slate-50"
              >
                <div class="flex min-w-0 items-center gap-2" :class="isFieldHidden(field) ? 'text-slate-400' : 'text-slate-700'">
                  <span v-if="getFieldMeta(field).text" class="field-type-text">{{ getFieldMeta(field).text }}</span>
                  <i v-else class="pi field-type-icon" :class="getFieldMeta(field).icon"></i>
                  <span class="truncate">{{ field.name }}</span>
                  <i v-if="field.required" class="pi pi-lock text-slate-400"></i>
                </div>
                <div class="flex items-center gap-1 text-slate-500">
                  <button
                    type="button"
                    class="rounded-md p-1 transition hover:bg-slate-100"
                    :aria-label="isFieldHidden(field) ? '显示字段' : '隐藏字段'"
                    @click.stop="toggleFieldVisibility(field)"
                  >
                    <i class="pi" :class="isFieldHidden(field) ? 'pi-eye-slash' : 'pi-eye'"></i>
                  </button>
                  <button type="button" class="rounded-md p-1 transition hover:bg-slate-100" aria-label="更多">
                    <i class="pi pi-ellipsis-h"></i>
                  </button>
                </div>
              </div>
            </div>
          </ScrollPanel>
          <div ref="fieldConfigFooter" class="border-t border-slate-200/80 px-3 py-2">
            <button type="button" class="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800" @click="openFieldCreateFromConfig">
              <i class="pi pi-plus"></i>
              <span>新增字段</span>
            </button>
          </div>
        </div>
      </Popover>
    </div>

    <div
      ref="tableWrap"
      class="flex min-h-10 flex-1 flex-col overflow-hidden"
    >
      <DataTable
        ref="dataTable"
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
          :header="field.name"
          :field="`${field.id}`"
          :style="{ minWidth: `${DEFAULT_FIELD_WIDTH}px`, width: `${getFieldWidth(field)}px`}"
          headerClass="field-cell"
          bodyClass="field-cell"
          :pt="{ headerCell: { 'data-field-id': field.id } }"
        >
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
          :style="hasHorizontalScroll ? '64px' : 'auto'"
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
              :footer=" visibleFields.length - 1 === index ? '' : '选择计算'"
              footer-style="text-align: right; font-size: 12px; color: #6b7280;"
            />
          </Row>
        </ColumnGroup>
      </DataTable>

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

      <Popover ref="fieldCreatePopover">
        <div class="w-80 space-y-4">
          <div class="space-y-2">
            <div class="text-sm text-slate-500">标题</div>
            <InputText v-model="fieldCreateName" placeholder="请输入字段标题" class="w-full" />
          </div>
          <div class="space-y-2">
            <div class="text-sm text-slate-500">字段类型</div>
            <Dropdown
              v-model="fieldCreateType"
              :options="fieldTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="选择字段类型"
              class="w-full"
            />
          </div>
          <div class="space-y-2">
            <div class="text-sm text-slate-500">默认值</div>
            <InputText v-model="fieldCreateDefault" placeholder="请输入内容" class="w-full" />
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <Button label="取消" text severity="secondary" @click="closeFieldCreatePopover" />
            <Button label="确定" @click="submitFieldCreate" />
          </div>
        </div>
      </Popover>
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
import { api } from '../api';
import { useWorkStore, type Field, type RecordRow } from '../stores/work';
import CellEditor from './components/CellEditor.vue';
import { defaultOptionsForField } from '../utils/field';

const props = defineProps<{ tableId?: string }>();

const route = useRoute();
const router = useRouter();
const work = useWorkStore();
const toast = useToast();

const resolvedTableId = computed(() => props.tableId ?? (route.params.tableId as string) ?? '');

const newFieldName = ref('');
const newFieldType = ref<Field['type']>('TEXT');
const fieldCreatePopover = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null);
const fieldConfigPopover = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null);
const fieldConfigContent = ref<HTMLElement | null>(null);
const fieldConfigListMaxHeight = ref(320);
const fieldCreateName = ref('');
const fieldCreateType = ref<Field['type']>('TEXT');
const fieldCreateDefault = ref('');
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

const fieldTypeMeta: Record<Field['type'], { icon?: string; text?: string }> = {
  TEXT: { icon: 'pi-pen-to-square' },
  NUMBER: { icon: 'pi-sort-numeric-up' },
  DATE: { icon: 'pi pi-calendar-clock' },
  SINGLE_SELECT: { icon: 'pi pi-check-circle' },
  MULTI_SELECT: { icon: 'pi pi-list-check' },
  USER: { icon: 'pi pi-user' },
  ATTACHMENT: { icon: 'pi pi-paperclip' },
};

const DEFAULT_FIELD_WIDTH = 120;

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

const HEIGHT_PER_ROW = 21;
const rowHeightPopover = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null);
const rowHeightOptions = [
  { value: 1, label: '低', iconClass: 'pi-minus' },
  { value: 2, label: '中等', iconClass: 'pi-equals' },
  { value: 4, label: '高', iconClass: 'pi-bars' },
  { value: 6, label: '超高', iconClass: 'pi-align-justify' },
] as const;
const rowHeight = ref<typeof rowHeightOptions[number]['value']>(rowHeightOptions[0].value);
const virtualScrollerOptions = computed(() => ({
  itemSize: 10 + rowHeight.value * HEIGHT_PER_ROW,
  delay: 0,
  numToleratedItems: 10,
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
function toggleRowHeightPopover(event: MouseEvent) {
  rowHeightPopover.value?.toggle(event);
}

function toggleFieldConfigPopover(event: MouseEvent) {
  fieldConfigPopover.value?.toggle(event);
  nextTick(updateFieldConfigMaxHeight);
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

function getFieldMeta(field: Field) {
  return fieldTypeMeta[field.type] ?? { icon: 'pi pi-align-left' };
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

function openFieldCreateFromConfig(event: MouseEvent) {
  fieldConfigPopover.value?.hide?.();
  fieldCreatePopover.value?.toggle(event);
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

function selectRowHeight(value: typeof rowHeightOptions[number]['value']) {
  const previous = rowHeight.value;
  rowHeight.value = value;
  rowHeightPopover.value?.hide?.();
  const tableId = resolvedTableId.value;
  if (!tableId) {
    nextTick(updateHorizontalScroll);
    return;
  }
  work.updateTable(tableId, { rowHeight: value }).catch((e: any) => {
    const message = e?.response?.data?.message ?? '保存行高失败';
    showUpdateErrorToast(message);
    rowHeight.value = previous;
  });
  nextTick(updateHorizontalScroll);
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

const fieldTypeOptions = [
  { label: '文本', value: 'TEXT' },
  { label: '数字', value: 'NUMBER' },
  { label: '日期', value: 'DATE' },
  { label: '单选', value: 'SINGLE_SELECT' },
  { label: '多选', value: 'MULTI_SELECT' },
];

function toggleFieldCreatePopover(event: MouseEvent) {
  fieldCreatePopover.value?.toggle(event);
}
function closeFieldCreatePopover() {
  fieldCreatePopover.value?.hide?.();
}

function resetFieldCreateForm() {
  fieldCreateName.value = '';
  fieldCreateType.value = 'TEXT';
  fieldCreateDefault.value = '';
}

async function submitFieldCreate() {
  const tableId = resolvedTableId.value;
  if (!tableId) return;
  const name = fieldCreateName.value.trim();
  if (!name) return;
  const type = fieldCreateType.value;
  const defaultValue = fieldCreateDefault.value.trim();
  const baseOptions = defaultOptionsForField(type);
  const options = defaultValue ? { ...(baseOptions ?? {}), defaultValue } : baseOptions;
  await work.createField(tableId, { name, type, options });
  resetFieldCreateForm();
  closeFieldCreatePopover();
}

const toolbarActions = [
  { label: '添加记录', icon: 'pi pi-plus', action: createRecord },
  { label: '字段配置', icon: 'pi pi-cog', action: toggleFieldConfigPopover },
  { label: '视图配置', icon: 'pi pi-th-large' },
  { label: '筛选', icon: 'pi pi-filter' },
  { label: '分组', icon: 'pi pi-sitemap' },
  { label: '排序', icon: 'pi pi-sort-amount-down' },
  { label: '行高', icon: 'pi pi-bars', action: toggleRowHeightPopover },
];

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

async function createField() {
  const tableId = resolvedTableId.value;
  if (!tableId) return;
  if (!newFieldName.value.trim()) return;
  const options = defaultOptionsForField(newFieldType.value);
  await work.createField(tableId, { name: newFieldName.value.trim(), type: newFieldType.value, options });
  newFieldName.value = '';
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

:deep(.field-config-scroll .p-scrollpanel-bar-x) {
  display: none;
}

:deep(.field-config-scroll .p-scrollpanel-bar-y) {
  width: 6px;
  border-radius: 9999px;
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
