<template>
  <Textarea
    v-if="field.type === FIELD_TYPE_TEXT"
    v-model="local"
    size="small"
    class="w-full h-full cell-textarea !absolute left-0 top-0 px-2"
    placeholder=""
  />

  <InputNumber
    v-else-if="field.type === FIELD_TYPE_NUMBER"
    v-model="local"
    size="small"
    v-bind="numberFieldProps"
    class="w-full h-full !absolute left-0 top-0 !rounded-none"
    inputClass="w-full h-full !rounded-none border-none outline-none shadow-none"
    placeholder=""
    @keydown.enter.prevent="commit"
  />

  <DatePicker
    v-else-if="field.type === FIELD_TYPE_DATE"
    v-model="local"
    size="small"
    :dateFormat="calendarDateFormat"
    :showTime="calendarShowTime"
    hourFormat="24"
    class="w-full h-full !absolute left-0 top-0"
    panelClass="cell-editor-overlay"
    inputClass="w-full !rounded-none"
    @show="onOverlayShow"
  />

  <Select
    v-else-if="field.type === FIELD_TYPE_SINGLE_SELECT"
    ref="dropdownRef"
    v-model="local"
    size="small"
    filter
    filterName="name"
    :options="choices"
    optionLabel="name"
    optionValue="id"
    class="w-full h-full !absolute left-0 top-0 !rounded-none"
    panelClass="cell-editor-overlay"
    @show="onOverlayShow"
  >
  </Select>

  <MultiSelect
    v-else-if="field.type === FIELD_TYPE_MULTI_SELECT"
    ref="multiSelectRef"
    v-model="local"
    size="small"
    filter
    filterName="name"
    :options="choices"
    optionLabel="name"
    optionValue="id"
    class="w-full h-full !absolute left-0 top-0 !rounded-none"
    display="chip"
    panelClass="cell-editor-overlay"
    @show="onOverlayShow"
  >
    <template #value="slotProps">
      <div class="flex flex-wrap gap-1 items-center h-full overflow-hidden content-center">
        <template v-if="slotProps.value && slotProps.value.length">
          <span 
            v-for="val in slotProps.value"
            :key="val" 
            class="inline-flex items-center px-1.5 py-0.5 rounded-xl bg-[#f1f5f9] text-[#1e293b] text-sm max-w-[100px] truncate h-5 border border-[#e2e8f0]"
          >
            {{ choices.find((c: any) => c.id === val)?.name || val }}
          </span>
        </template>
        <template v-else>
          <span class="text-slate-400 h-3 text-sm">{{ slotProps.placeholder || '查找选项' }}</span>
        </template>
      </div>
    </template>
  </MultiSelect>

  <span v-else class="text-slate-400">(未实现)</span>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { Field, RecordRow } from '../stores/work';
import {
  FIELD_TYPE_TEXT,
  FIELD_TYPE_NUMBER,
  FIELD_TYPE_DATE,
  FIELD_TYPE_SINGLE_SELECT,
  FIELD_TYPE_MULTI_SELECT,
  FIELD_TYPE_USER,
  FIELD_TYPE_GROUP,
  FIELD_TYPE_ATTACHMENT,
  FIELD_TYPE_CHECKBOX,
  FIELD_TYPE_URL,
  FIELD_TYPE_FORMULA,
  FIELD_TYPE_LOOKUP,
  FIELD_TYPE_WORKFLOW,
  FIELD_TYPE_BUTTON,
  dateFormatOptions,
  numberFormatOptions,
  formatDate
} from '../constants/table';

const props = defineProps<{
  field: Field;
  record: RecordRow;
}>();

const emit = defineEmits<{
  (e: 'update', payload: { recordId: string; revision: number; fieldId: string; type: string; value: any }): void;
}>();

const dropdownRef = ref();
const multiSelectRef = ref();

onMounted(() => {
  if (props.field.type === FIELD_TYPE_SINGLE_SELECT) {
    nextTick(() => {
      dropdownRef.value?.show();
    });
  } else if (props.field.type === FIELD_TYPE_MULTI_SELECT) {
    nextTick(() => {
      multiSelectRef.value?.show();
    });
  }
});

const fieldId = computed(() => props.field.id);

// PrimeVue 的 Calendar (DatePicker) 使用了一套基于 jQuery UI Datepicker 的老式格式字符串（例如 yy 代表 4 位年份）
// https://primevue.org/datepicker/#format
const calendarDateFormat = computed(() => {
  const fmt = props.field.options?.format;
  if (!fmt) return 'yy-mm-dd';
  // Extract date part (everything before the first space)
  const datePart = fmt.split(' ')[0];
  // Convert standard format (YYYY/MM/DD) to PrimeVue format (yy/mm/dd)
  return datePart
    .replace('YYYY', 'yy')
    .replace('MM', 'mm')
    .replace('DD', 'dd');
});
const calendarShowTime = computed(() => {
  const fmt = props.field.options?.format;
  return fmt ? fmt.includes('HH:mm') : false;
});

const numberFieldProps = computed(() => {
  const fmt = props.field.options?.format;
  if (!fmt || fmt === 'integer') {
    return { minFractionDigits: 0, maxFractionDigits: 0, useGrouping: false };
  }
  if (fmt === 'thousands') {
    return { minFractionDigits: 0, maxFractionDigits: 0, useGrouping: true };
  }
  if (fmt === 'thousands-decimal') {
    return { useGrouping: true };
  }
  if (fmt === 'percent') {
    return { suffix: '%' }; // Note: PrimeVue might treat input 50 as 50%, not 0.5. Depends on implementation.
  }
  if (fmt === 'percent-decimal') {
    return { suffix: '%', minFractionDigits: 2 }; 
  }
  if (fmt.startsWith('decimal-')) {
    const digits = parseInt(fmt.split('-')[1], 10);
    return { minFractionDigits: digits, maxFractionDigits: digits, useGrouping: false };
  }
  return {};
});

function normalizeLocalValue(value: any) {
  if (props.field.type === FIELD_TYPE_MULTI_SELECT) {
    return Array.isArray(value) ? value : [];
  }
  if (props.field.type === FIELD_TYPE_DATE) {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (props.field.type === FIELD_TYPE_NUMBER) {
    // If it's a number, we might want to ensure it respects decimal places or other formats
    // But usually for editing, we just return the raw number or string representation
    if (value === null || value === undefined || value === '') return null;
    return Number(value);
  }
  return value;
}

const local = ref<any>(normalizeLocalValue(props.record.data?.[fieldId.value]));

watch(
  () => props.record.data?.[fieldId.value],
  (v) => {
    local.value = normalizeLocalValue(v);
  }
);

const choices = computed(() => props.field.options?.options ?? []);

function commit() {
  let v = local.value;

  // handle Number type
  if (props.field.type === FIELD_TYPE_NUMBER) {
    const num = v === '' || v === null || v === undefined ? null : Number(v);
    v = Number.isFinite(num) ? num : null;
  }

  emit('update', {
    recordId: props.record.id,
    revision: props.record.revision,
    fieldId: fieldId.value,
    type: props.field.type,
    value: v
  });
}

// Hack: When overlay is shown, attach stopPropagation listener to it
// to prevent DataTable from detecting outside click and closing the editor
const stopProp = (e: Event) => {
  e.stopPropagation();
};

function onOverlayShow() {
  window.setTimeout(() => {
    const overlays = document.querySelectorAll('.cell-editor-overlay');
    overlays.forEach((overlay: any) => {
      // Add listeners
      overlay.addEventListener('mousedown', stopProp);
      overlay.addEventListener('mouseup', stopProp);
      overlay.addEventListener('click', stopProp);
    });
  }, 0);
}

onUnmounted(() => {
  // Submit current value when component is unloaded
  commit()

  const overlays = document.querySelectorAll('.cell-editor-overlay');
  overlays.forEach(overlay => {
    overlay.removeEventListener('mousedown', stopProp);
    overlay.removeEventListener('mouseup', stopProp);
    overlay.removeEventListener('click', stopProp);
  });
})
</script>

<style scoped>
.cell-textarea {
  display: block;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.6) transparent;
  resize: none;
  font-size: 14px;
  padding: 0;
  border-radius: 0;
}

.cell-textarea::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.cell-textarea::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.6);
  border-radius: 9999px;
}

.cell-textarea::-webkit-scrollbar-track {
  background: transparent;
}
</style>
