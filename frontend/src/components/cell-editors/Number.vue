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
import { computed, onUnmounted } from 'vue';
import { InputNumber } from 'primevue';
import type { Field } from '../../types/table';
import { getNumberInputProps } from '../../utils/field';

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

onUnmounted(() => {
  // Submit current value when component is unloaded
  commit();
});

function commit() {
  emit('commit');
}

const numberFieldProps = computed(() => {
  return getNumberInputProps(props.field.config?.format);
});
</script>
