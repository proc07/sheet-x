<template>
  <Textarea
    v-model="local"
    size="small"
    class="w-full h-full cell-textarea !absolute left-0 top-0 !p-[0.375rem]"
    placeholder=""
    @keydown.enter.prevent="commit"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Textarea } from 'primevue';

const props = defineProps<{
  modelValue: string | null | undefined;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
  (e: 'commit'): void;
}>();

const local = computed({
  get: () => props.modelValue ?? '',
  set: (v) => emit('update:modelValue', v),
});

function commit() {
  emit('commit');
}
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
