<template>
  <div class="datatable-body-cell w-full whitespace-normal text-ellipsis" :class="getCellClass(field, rowHeight)" :style="{ height: `${rowHeight * HEIGHT_PER_ROW}px` }">
    <template v-if="field.type === FIELD_TYPE_SINGLE_SELECT && getFieldData<string>(field.id)">
      <span class="inline-flex items-center px-1.5 py-0.5 rounded-xl bg-blue-100 text-blue-700 text-sm max-w-full truncate h-6 border border-blue-200">
        {{ getSelectOptionName(field, getFieldData<string>(field.id)!) }}
      </span>
    </template>
    <template v-else-if="field.type === FIELD_TYPE_MULTI_SELECT && Array.isArray(getFieldData<string[]>(field.id))">
      <MultiSelect
        :value="getFieldData<string[]>(field.id)!"
        :field="field"
        :row-height="rowHeight"
      />
    </template>
    <template v-else-if="field.type === FIELD_TYPE_DATE && getFieldData<string>(field.id)">
      {{ formatDate(getFieldData<string>(field.id), field) }}
    </template>
    <template v-else-if="field.type === FIELD_TYPE_CHECKBOX">
      <div class="h-full flex items-center justify-center">
        <Checkbox :modelValue="!!getFieldData<boolean>(field.id)" binary readonly />
      </div>
    </template>
    <template v-else-if="field.type === FIELD_TYPE_URL && getFieldData<UrlData>(field.id)">
      <a 
        :href="getFieldData<UrlData>(field.id)?.link"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-600 hover:underline truncate"
        v-tooltip.top="getFieldData<UrlData>(field.id)?.link"
        @click.stop
      >
        {{ getFieldData<UrlData>(field.id)?.text || getFieldData<UrlData>(field.id)?.link }}
      </a>
    </template>
    <template v-else-if="field.type === FIELD_TYPE_ATTACHMENT && Array.isArray(getFieldData<Attachment[]>(field.id))">
      <div class="flex items-center gap-1 h-full overflow-hidden px-1">
        <div 
          v-for="(file, idx) in getFieldData<Attachment[]>(field.id)" 
          :key="idx"
          class="h-full flex-shrink-0 border rounded flex items-center justify-center bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors"
          @mouseenter="(e) => showAttachmentPreview(e, file)"
          @mouseleave="hideAttachmentPreview"
          @click.stop
        >
          <img
            v-if="isImage(file)" 
            :src="file.url" 
            class="w-full h-full object-cover rounded pointer-events-none" 
          />
          <i v-else :class="['pi text-xs px-2', getFileIcon(file)]"></i>
        </div>
      </div>
    </template>
    <template v-else>
      <div v-tooltip.top="getFieldData<string>(field.id)">
        {{ getFieldData<string>(field.id) }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Field, RecordRow, Attachment, UrlData } from '../stores/work';
import {
  HEIGHT_PER_ROW,
  formatDate,
  FIELD_TYPE_SINGLE_SELECT,
  FIELD_TYPE_MULTI_SELECT,
  FIELD_TYPE_DATE,
  FIELD_TYPE_ATTACHMENT,
  FIELD_TYPE_CHECKBOX,
  FIELD_TYPE_URL
} from '../constants/table';
import MultiSelect from './cell-renderer/MultiSelectCell.vue';
import { isImage, getFileIcon } from '../utils/field';

const props = defineProps<{
  field: Field;
  data: RecordRow;
  rowHeight: number;
}>();

const emit = defineEmits<{
  (e: 'show-attachment-preview', event: Event, file: Attachment): void;
  (e: 'hide-attachment-preview'): void;
}>();

// Helper to get typed data safely
function getFieldData<T>(fieldId: string): T | undefined {
  return props.data.data?.[fieldId] as T;
}

function getCellClass(field: Field, rowHeight: number) {
  // MultiSelect handles its own overflow/clamping via CellMultiSelect component
  if (field.type === FIELD_TYPE_MULTI_SELECT || field.type === FIELD_TYPE_SINGLE_SELECT) {
    return "";
  }
  return `line-clamp-${rowHeight}`;
}

function getSelectOptionName(field: Field, value: string) {
  const options = field.config?.options as Array<{ id: string; name: string }>;
  if (!options) return value;
  
  const opt = options.find(o => o.id === value);
  return opt ? opt.name : value;
}

function showAttachmentPreview(event: Event, file: Attachment) {
  emit('show-attachment-preview', event, file);
}

function hideAttachmentPreview() {
  emit('hide-attachment-preview');
}
</script>
