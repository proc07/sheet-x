<template>
  <div>
    <InputText
      v-if="field.type === 'TEXT'"
      v-model="local"
      class="w-full"
      @blur="commit"
      placeholder=""
    />

    <InputText
      v-else-if="field.type === 'NUMBER'"
      v-model="local"
      type="number"
      class="w-full"
      @blur="commitNumber"
      placeholder=""
    />

    <Calendar
      v-else-if="field.type === 'DATE'"
      v-model="local"
      dateFormat="yy-mm-dd"
      showIcon
      class="w-full"
      @change="commit"
    />

    <Dropdown
      v-else-if="field.type === 'SINGLE_SELECT'"
      v-model="local"
      :options="choices"
      optionLabel="label"
      optionValue="id"
      class="w-full"
      showClear
      @change="commit"
    />

    <MultiSelect
      v-else-if="field.type === 'MULTI_SELECT'"
      v-model="local"
      :options="choices"
      optionLabel="label"
      optionValue="id"
      class="w-full"
      display="chip"
      showClear
      @change="commit"
    />

    <span v-else class="text-slate-400">(未实现)</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Field, RecordRow } from '../../stores/work';

const props = defineProps<{
  field: Field;
  record: RecordRow;
}>();

const emit = defineEmits<{
  (e: 'update', payload: { recordId: string; revision: number; fieldId: string; value: any }): void;
}>();

const fieldId = computed(() => props.field.id);

function normalizeLocalValue(value: any) {
  if (props.field.type === 'MULTI_SELECT') {
    return Array.isArray(value) ? value : [];
  }
  if (props.field.type === 'DATE') {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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

const choices = computed(() => props.field.options?.choices ?? []);

function commit() {
  emit('update', { recordId: props.record.id, revision: props.record.revision, fieldId: fieldId.value, value: local.value });
}

function commitNumber() {
  const v = local.value;
  const num = v === '' || v === null || v === undefined ? null : Number(v);
  emit('update', { recordId: props.record.id, revision: props.record.revision, fieldId: fieldId.value, value: Number.isFinite(num as any) ? num : null });
}
</script>
