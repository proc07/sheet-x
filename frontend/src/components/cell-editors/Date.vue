<template>
  <DatePicker
    v-model="local"
    size="small"
    :dateFormat="calendarDateFormat"
    :showTime="calendarShowTime"
    hourFormat="24"
    class="w-full h-full !absolute left-0 top-0"
    :panelClass="EDITOR_OVERLAY_CLASS"
    inputClass="w-full !rounded-none"
    @show="setupOverlayPropagation"
    @hide="commit"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DatePicker } from 'primevue';
import type { Field } from '../../stores/work';
import { EDITOR_OVERLAY_CLASS, setupOverlayPropagation } from '../../utils/overlay';

const props = defineProps<{
  modelValue: string | Date | null | undefined;
  field: Field;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date | null): void;
  (e: 'commit'): void;
}>();

const local = computed({
  get: () => {
    if (!props.modelValue) return null;
    const d = props.modelValue instanceof Date ? props.modelValue : new Date(props.modelValue);
    return isNaN(d.getTime()) ? null : d;
  },
  set: (v) => emit('update:modelValue', v),
});

function commit() {
  emit('commit');
}

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
</script>
