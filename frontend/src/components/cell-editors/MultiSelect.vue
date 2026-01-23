<template>
  <MultiSelect
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
    :panelClass="EDITOR_OVERLAY_CLASS"
    @show="setupOverlayPropagation"
    @hide="commit"
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
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue';
import { MultiSelect } from 'primevue';
import type { Field } from '../../stores/work';
import { EDITOR_OVERLAY_CLASS, setupOverlayPropagation } from '../../utils/overlay';

const props = defineProps<{
  modelValue: string[] | null | undefined;
  field: Field;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
  (e: 'commit'): void;
}>();

const multiSelectRef = ref();

const local = computed({
  get: () => Array.isArray(props.modelValue) ? props.modelValue : [],
  set: (v) => emit('update:modelValue', v),
});

const choices = computed(() => props.field.options?.options ?? []);

function commit() {
  emit('commit');
}

onMounted(() => {
  nextTick(() => {
    multiSelectRef.value?.show();
  });
});
</script>
