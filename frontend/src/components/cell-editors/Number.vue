<template>
  <InputNumber
    v-model="local"
    size="small"
    v-bind="numberFieldProps"
    class="w-full h-full !absolute left-0 top-0 !rounded-none"
    inputClass="w-full h-full !rounded-none border-none outline-none shadow-none"
    placeholder=""
    @keydown.enter.prevent="commit"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { InputNumber } from 'primevue';
import type { Field } from '../../stores/work';

const props = defineProps<{
  modelValue: number | string | null | undefined;
  field: Field;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
  (e: 'commit'): void;
}>();

const local = computed({
  get: () => {
    if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return null;
    return Number(props.modelValue);
  },
  set: (v) => emit('update:modelValue', v),
});

function commit() {
  emit('commit');
}

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
    return { suffix: '%' };
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
</script>
