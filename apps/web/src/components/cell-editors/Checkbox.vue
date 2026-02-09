<template>
  <div class="w-full h-full flex items-center justify-center bg-white !absolute left-0 top-0 !rounded-none">
    <Checkbox v-model="local" :binary="true" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Checkbox } from 'primevue';

const props = defineProps<{
  modelValue: boolean | null | undefined;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'commit'): void;
}>();

const local = computed({
  get: () => !!props.modelValue,
  set: (v) => {
    emit('update:modelValue', v);
    // Checkbox updates immediately usually
    emit('commit');
  },
});
</script>
