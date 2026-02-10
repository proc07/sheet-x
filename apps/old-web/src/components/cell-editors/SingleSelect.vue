<template>
  <Select
    ref="dropdownRef"
    v-model="local"
    size="small"
    filter
    filterName="name"
    :options="choices"
    optionLabel="name"
    optionValue="id"
    class="w-full h-full !absolute left-0 top-0 !rounded-none"
    :panelClass="EDITOR_OVERLAY_CLASS"
    @show="setupOverlayPropagation"
    @hide="commit"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue';
import { Select } from 'primevue';
import type { Field } from '../../types/table';
import { EDITOR_OVERLAY_CLASS, setupOverlayPropagation } from '../../utils/overlay';

const props = defineProps<{
  modelValue: string | null | undefined;
  field: Field;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
  (e: 'commit'): void;
}>();

const dropdownRef = ref();

const local = computed({
  get: () => props.modelValue ?? null,
  set: (v) => emit('update:modelValue', v),
});

const choices = computed(() => props.field.config?.options ?? []);

function commit() {
  emit('commit');
}

onMounted(() => {
  nextTick(() => {
    dropdownRef.value?.show();
  });
});
</script>
