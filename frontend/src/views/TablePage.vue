<template>
  <div class="flex h-full min-h-0 flex-col ">
    <TableToolbar
      :fields="work.fields"
      :row-height="rowHeight"
      :loading="loading"
      v-model:filters="filters"
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
        :value="filteredRecords"
        :reorderableColumns="true"
        @columnReorder="() => onColReorder(tableWrap)"
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
          :bodyStyle="{ textAlign: 'center' }"
        ></Column>
        <Column
          :reorderableColumn="false"
          columnKey="row-id"
          frozen
          header="ID"
          headerClass="w-[100px] p-10 cursor-unset! frozen-border-right"
          bodyClass="frozen-border-right"
        >
          <template #body="{ data }">
            <div 
              class="flex items-center w-full h-full cursor-pointer group -ml-2 pl-2" 
              @click="copyId(data.id)"
              title="点击复制 ID"
            >
              <i class="pi pi-copy text-[10px] text-slate-300 mr-1.5 transition-opacity"></i>
              <span class="text-xs text-gray-400 font-mono">{{ data.id.slice(0, 8) }}</span>
            </div>
          </template>
        </Column>
        <Column
          v-for="(field, index) in visibleFields"
          :key="field.id"
          :columnKey="field.id"
          :field="`${field.id}`"
          :style="{ minWidth: `${DEFAULT_FIELD_WIDTH}px`, width: `${getFieldWidth(field)}px`}"
          :headerClass="`field-cell group ${field.frozen ? 'frozen-border-right' : ''}`"
          :bodyClass="`field-cell ${field.frozen ? 'frozen-border-right' : ''}`"
          :pt="{ headerCell: { 'data-field-id': field.id } }"
          :frozen="!!field.frozen"
        >
          <template #header>
            <div class="flex items-center gap-1 w-full overflow-hidden">
              <i class="pi text-slate-400 text-xs mr-1 flex-shrink-0" :class="getFieldTypeIcon(field.type)"></i>
              <span class="truncate flex-1" :title="field.name">{{ field.name }}</span>
              <div 
                class="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                :class="{ 'opacity-100 bg-slate-100': fieldMenuContext?.field.id === field.id && fieldMenuVisible }"
                @click.stop="openFieldMenu($event, field, index)"
              >
                <i class="pi pi-angle-down text-xs text-slate-500"></i>
              </div>
            </div>
          </template>
          <template #body="{ data }">
            <CellRenderer
              :field="field"
              :data="data"
              :row-height="rowHeight"
              @show-attachment-preview="showAttachmentPreview"
              @hide-attachment-preview="hideAttachmentPreview"
            />
          </template>
          <template #editor="{ data }">
            <CellEditor
              :field="field"
              :record="data"
              @update="onUpdateCell"
            />
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
              frozen
              :footer="`${filteredRecords.length}条记录`"
              footer-class="frozen-border-right text-right! text-xs text-gray-400!"
            />
            <Column
              v-for="field in visibleFields"
              :key="`footer-${field.id}`"
              :frozen="!!field.frozen"
              :footer-class="`text-right text-xs text-gray-400! cursor-pointer field-cell ${field.frozen ? 'frozen-border-right' : ''}`"
            >
              <template #footer>
                 <div @click="openStatPopover($event, field.id)" class="hover:bg-slate-100 py-1 px-1 rounded flex items-center justify-end gap-1 group">
                   <span>{{ getStatLabel(field.id) }}</span>
                   <i
                    class="pi text-slate-400 group-hover:text-slate-600 !text-[12px]"
                    :class="currentStatFieldId === field.id && statPopoverVisible ? 'pi-sort-up-fill' : 'pi-sort-down-fill'"
                   ></i>
                 </div>
               </template>
             </Column>
               <Column
                columnKey="field-add"
                :style="{ width: hasHorizontalScroll ?  DEFAULT_FIELD_WIDTH + 'px' : 'auto' }"
              >
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

      <!-- Attachment Preview Popover -->
      <Popover ref="attachmentPreviewPopover" :dismissable="false">
        <div 
          class="bg-white p-2 rounded-lg max-w-[280px]"
          @mouseenter="clearHideTimer"
          @mouseleave="hideAttachmentPreview"
        >
          <div class="text-xs font-medium text-slate-700 mb-2 truncate px-1" :title="previewFile?.name">
            {{ previewFile?.name }}
          </div>
          <div class="rounded overflow-hidden bg-slate-100 flex items-center justify-center min-h-[120px] relative group">
            <Image 
              v-if="previewFile && isImage(previewFile)" 
              :src="previewFile.url" 
              alt="Image" 
              preview 
              imageClass="max-w-full max-h-[200px] object-contain"
              :pt="{
                root: { class: 'flex justify-center' },
                button: { class: 'hidden' }
              }"
            />
            <div v-else class="flex flex-col items-center gap-2 py-4">
              <i :class="['pi text-4xl', previewFile ? getFileIcon(previewFile) : '']"></i>
              <span class="text-xs text-slate-400">{{ previewFile?.type }}</span>
            </div>
          </div>
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

      <Menu ref="fieldMenu" :model="fieldMenuItems" popup @show="fieldMenuVisible = true" @hide="fieldMenuVisible = false" />

      <Dialog v-model:visible="fieldCreateVisible" :draggable="false" modal header="新增字段" class="min-w-[320px]">
        <FieldCreateForm
          :tableId="resolvedTableId"
          :initialName="currentEditField?.name"
          :initialType="currentEditField?.type"
          :initialOptions="currentEditField?.config"
          @submit="handleFieldCreateSubmit"
          @cancel="closeFieldCreatePopover"
        />
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, type Ref, nextTick } from 'vue';
import type { DataTableRowReorderEvent } from 'primevue/datatable';
import { useRoute } from 'vue-router';
import { Image } from 'primevue';

import { useWorkStore, type RecordRow } from '../stores/work';
import TableToolbar from '../components/TableToolbar.vue';
import CellRenderer from '../components/CellRenderer.vue';
import CellEditor from '../components/CellEditor.vue';
import FieldCreateForm from '../components/FieldCreateForm.vue';
import { DEFAULT_FIELD_WIDTH } from '../constants/table';
import { getFieldTypeIcon, isImage, getFileIcon } from '../utils/field';

import { useTableFilter } from '../composables/table/useTableFilter';
import { useTableStats } from '../composables/table/useTableStats';
import { useTableLayout } from '../composables/table/useTableLayout';
import { useTableFields } from '../composables/table/useTableFields';
import { useTableRecords } from '../composables/table/useTableRecords';
import { useTableSelection } from '../composables/table/useTableSelection';

const props = defineProps<{ tableId?: string }>();
const route = useRoute();
const work = useWorkStore();

const resolvedTableId = computed(() => props.tableId ?? (route.params.tableId as string) ?? '');

// 1. Filter
const { 
  filters, 
  filteredRecords, 
  recordIndexMap 
} = useTableFilter();

// 2. Stats
const {
  fieldStats,
  statPopover,
  currentStatFieldId,
  statPopoverVisible,
  statOptions,
  getStatLabel,
  openStatPopover,
  selectStat
} = useTableStats(resolvedTableId);

// 3. Layout
const {
  dataTable,
  tableWrap,
  rowHeight,
  hasHorizontalScroll,
  tableHeight,
  virtualScrollerOptions,
  selectRowHeight,
  updateHorizontalScroll,
  normalizeRowHeight,
} = useTableLayout(resolvedTableId);

// 4. Fields
const {
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
} = useTableFields(resolvedTableId, {
  onLayoutUpdate: () => nextTick(updateHorizontalScroll)
});

// 5. Records
const {
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
} = useTableRecords(resolvedTableId, {
  onLayoutUpdate: () => nextTick(updateHorizontalScroll)
});

// 6. Selection
const {
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
} = useTableSelection({
  insertRows: async (direction, count, anchor) => insertRows(direction, count, anchor),
  deleteRecord: async (id) => deleteRecord(id),
});

// Row Styles & Classes
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

// Watch Table ID change
watch(
  () => resolvedTableId.value,
  async (tableId) => {
    if (!tableId) return;
    const table = await reload();
    if (table?.rowHeight !== undefined) {
      rowHeight.value = normalizeRowHeight(table.rowHeight);
    }
  },
  { immediate: true }
);

const onRowReorder = (event: DataTableRowReorderEvent) => {
  console.log('row reorder', event);
  work.records = event.value;
};

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

:deep(.field-cell) {
  background-color: #fff;
  position: relative; /* Required for editor positioning */
}

/* Ensure frozen columns have higher z-index, opaque background, and sticky positioning */
:deep(.p-datatable .p-datatable-tbody > tr > td.p-datatable-frozen-column),
:deep(.p-datatable .p-datatable-tfoot > tr > td.p-datatable-frozen-column) {
  z-index: 2;
  background-color: #ffffff;
  position: sticky !important; /* Override relative */
  left: 0; /* Ensure left is set if PrimeVue doesn't set it inline, though usually it does */
}

/* Maintain selection highlight for frozen columns */
:deep(.table-row-select .p-datatable-tbody > tr.p-highlight > td.p-datatable-frozen-column),
:deep(.table-row-select .p-datatable-tbody > tr.row-selected > td.p-datatable-frozen-column),
:deep(.table-row-select .p-datatable-tbody > tr.p-datatable-row-selected > td.p-datatable-frozen-column) {
  background-color: #cbd5e1 !important;
}

:deep(.table-row-select .p-datatable-tbody > tr:hover > td.p-datatable-frozen-column) {
  background-color: #f1f5f9;
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

:deep(.frozen-border-right) {
  overflow: unset!important;
}
:deep(.frozen-border-right)::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  right: -1px;
  width: 1px;
  background-color: #e2e8f0;
  z-index: 2;
}
</style>
