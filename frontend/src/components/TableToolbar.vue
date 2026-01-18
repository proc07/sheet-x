<template>
  <div class="overflow-hidden shrink-0">
    <div class="flex flex-wrap items-center gap-2 py-2">
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

    <Popover ref="fieldConfigPopover" :dismissable="false">
      <div ref="fieldConfigContent" class="w-72">
        <div class="border-b border-slate-200/80">
          <div ref="fieldConfigHeader" class="mb-1 flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700">
            <span>字段配置</span>
            <i class="pi pi-question-circle text-slate-400"></i>
          </div>
        </div>
        <div class="field-config-scroll" :style="{ maxHeight: `${fieldConfigListMaxHeight}px` }">
          <div class="py-1">
            <div
              v-for="field in fields"
              :key="`config-${field.id}`"
              class="group flex items-center justify-between cursor-grab rounded-md gap-2 px-2 py-2 text-sm transition hover:bg-slate-100 border-b-2"
              :class="{
                'bg-black-50 border-black-500': dragOverField?.id === field.id,
                'border-transparent': dragOverField?.id !== field.id
              }"
              draggable="true"
              @dragstart="onDragStart($event, field)"
              @dragover="onDragOver($event, field)"
              @dragleave="onDragLeave"
              @dragend="onDragEnd"
              @drop="onDrop($event, field)"
            >
              <div class="flex items-center gap-2" :class="isFieldHidden(field) ? 'text-slate-400' : 'text-slate-700'">
                <span v-if="getFieldMeta(field).text" class="field-type-text">{{ getFieldMeta(field).text }}</span>
                <i v-else class="pi field-type-icon" :class="getFieldMeta(field).icon"></i>
                <span class="truncate">{{ field.name }}</span>
                <i v-if="field.required" class="pi pi-lock text-slate-400"></i>
              </div>
              <div class="flex items-center gap-1 text-slate-500">
                <button
                  type="button"
                  class="flex items-center cursor-pointer rounded-md p-1 transition hover:bg-slate-200"
                  :aria-label="isFieldHidden(field) ? '显示字段' : '隐藏字段'"
                  @click.stop="toggleFieldVisibility(field)"
                >
                  <i class="pi" :class="isFieldHidden(field) ? 'pi-eye-slash' : 'pi-eye'"></i>
                </button>
                <button
                  type="button"
                  class="flex items-center cursor-pointer rounded-md p-1 transition hover:bg-slate-200"
                  aria-label="更多"
                  @click.stop="toggleFieldMenu($event, field)"
                >
                  <i class="pi pi-ellipsis-h"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div ref="fieldConfigFooter" class="border-t border-slate-200/80">
          <button type="button" class="w-full mt-1 cursor-pointer rounded-md flex items-center px-2 py-2 gap-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100" @click="openFieldCreateFromConfig">
            <i class="pi pi-plus field-type-icon"></i>
            <span>新增字段</span>
          </button>
        </div>
      </div>
    </Popover>

    <Menu ref="fieldMenu" :model="menuItems" :popup="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { rowHeightOptions, fieldTypeMeta } from '../constants/table';
import type { Field } from '../stores/work';

const props = defineProps<{
  fields: Field[];
  rowHeight: number;
  loading: boolean;
  isFieldCreateOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:rowHeight', value: number): void;
  (e: 'createRecord', event: MouseEvent): void;
  (e: 'toggleFieldVisibility', field: Field): void;
  (e: 'openFieldCreate', event: MouseEvent): void;
  (e: 'editField', field: Field): void;
  (e: 'deleteField', field: Field): void;
  (e: 'reorderFields', fields: Field[]): void;
}>();

const rowHeightPopover = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null);
const fieldConfigPopover = ref<{ toggle: (event: Event) => void; hide: () => void; visible: boolean } | null>(null);
const fieldConfigContent = ref<HTMLElement | null>(null);
const fieldConfigListMaxHeight = ref(320);

// Drag and Drop
const draggingField = ref<Field | null>(null);
const dragOverField = ref<Field | null>(null);

function onDragStart(event: DragEvent, field: Field) {
  draggingField.value = field;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
  }
}

function onDragOver(event: DragEvent, field: Field) {
  event.preventDefault(); // Necessary to allow dropping
  if (draggingField.value && draggingField.value.id !== field.id) {
    dragOverField.value = field;
  }
}

function onDragLeave(event: DragEvent) {
  // Check if we really left the list item (not just entering a child)
  // But simpler to just rely on drop or new dragover clearing it. 
  // Actually, dragover fires continuously, so we set it there. 
  // But we need to clear it if we leave the list area?
  // Let's rely on `onDragEnd` to clear everything.
}

function onDragEnd() {
  draggingField.value = null;
  dragOverField.value = null;
}

function onDrop(event: DragEvent, targetField: Field) {
  event.preventDefault();
  dragOverField.value = null;
  if (!draggingField.value || draggingField.value.id === targetField.id) return;

  const currentFields = [...props.fields];
  const fromIndex = currentFields.findIndex(f => f.id === draggingField.value?.id);
  const toIndex = currentFields.findIndex(f => f.id === targetField.id);

  if (fromIndex === -1 || toIndex === -1) return;

  // Move item
  const [movedItem] = currentFields.splice(fromIndex, 1);
  currentFields.splice(toIndex, 0, movedItem);

  // Emit new order
  emit('reorderFields', currentFields);
  draggingField.value = null;
}

const fieldMenu = ref();
const currentField = ref<Field | null>(null);
const menuItems = [
  {
    label: '编辑',
    icon: 'pi pi-pencil',
    command: () => {
      if (currentField.value) emit('editField', currentField.value);
    }
  },
  {
    label: '删除',
    icon: 'pi pi-trash',
    class: 'text-red-500',
    command: () => {
      if (currentField.value) emit('deleteField', currentField.value);
    }
  }
];

function toggleFieldMenu(event: Event, field: Field) {
  currentField.value = field;
  fieldMenu.value?.toggle(event);
}

function toggleRowHeightPopover(event: MouseEvent) {
  rowHeightPopover.value?.toggle(event);
}

function selectRowHeight(value: number) {
  emit('update:rowHeight', value);
  rowHeightPopover.value?.hide?.();
}

function handleFieldConfigOutsideClick(event: Event) {
  const popover = fieldConfigContent.value;
  if (!popover) return;

  const target = event.target as HTMLElement;
  // If click is inside the popover, ignore
  if (popover.contains(target)) return;

  // If field create modal is open, ignore outside clicks
  if (props.isFieldCreateOpen) return;

  // Otherwise, close
  fieldConfigPopover.value?.hide();
  document.removeEventListener('click', handleFieldConfigOutsideClick, true);
}

function toggleFieldConfigPopover(event: MouseEvent) {
  // visible property exists
  if (fieldConfigPopover.value?.visible) {
    fieldConfigPopover.value?.hide();
    document.removeEventListener('click', handleFieldConfigOutsideClick, true);
  } else {
    fieldConfigPopover.value?.toggle(event);
    nextTick(updateFieldConfigMaxHeight);
    setTimeout(() => {
        document.addEventListener('click', handleFieldConfigOutsideClick, true);
    }, 0);
  }
}

function updateFieldConfigMaxHeight() {
  const content = fieldConfigContent.value;
  if (!content) return;
  const rect = content.getBoundingClientRect();
  if (!rect.height && !rect.top) return;
  const padding = 100;
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

function toggleFieldVisibility(field: Field) {
  emit('toggleFieldVisibility', field);
}

function openFieldCreateFromConfig(event: MouseEvent) {
  // Don't hide, just emit the event.
  // The user wants both popovers to stay open.
  // fieldConfigPopover.value?.hide?.();
  emit('openFieldCreate', event);
}

function handleWindowResize() {
  updateFieldConfigMaxHeight();
}

function handleWindowScroll() {
  updateFieldConfigMaxHeight();
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize);
  window.addEventListener('scroll', handleWindowScroll, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize);
  window.removeEventListener('scroll', handleWindowScroll, true);
});

const toolbarActions = [
  { label: '添加记录', icon: 'pi pi-plus', action: (e: MouseEvent) => emit('createRecord', e) },
  { label: '字段配置', icon: 'pi pi-cog', action: toggleFieldConfigPopover },
  { label: '视图配置', icon: 'pi pi-th-large' },
  { label: '筛选', icon: 'pi pi-filter' },
  { label: '分组', icon: 'pi pi-sitemap' },
  { label: '排序', icon: 'pi pi-sort-amount-down' },
  { label: '行高', icon: 'pi pi-bars', action: toggleRowHeightPopover },
];
</script>

<style scoped>
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
</style>
