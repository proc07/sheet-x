<template>
  <DatePicker
    v-model="local"
    size="small"
    v-bind="datePickerProps"
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
import type { Field } from '../../types/table';
import { EDITOR_OVERLAY_CLASS, setupOverlayPropagation } from '../../utils/overlay';
import { getDatePickerProps } from '../../utils/field';

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

const datePickerProps = computed(() => getDatePickerProps(props.field.config?.format));
</script>
