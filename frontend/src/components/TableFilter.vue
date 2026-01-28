<template>
  <div class="flex flex-col gap-3 w-120">
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-gray-700">设置筛选条件</h3>
      <Button 
        icon="pi pi-question-circle" 
        text 
        rounded 
        size="small" 
        class="text-gray-400 hover:text-gray-600" 
      />
    </div>

    <div v-if="filters.length === 0" class="text-sm text-gray-500 py-4 text-center">
      暂无筛选条件
    </div>

    <div v-for="(filter, index) in filters" :key="index" class="flex items-center gap-2">
      <!-- 1. Field Selector -->
      <Select
        v-model="filter.fieldId"
        :options="fieldOptions"
        optionLabel="name"
        optionValue="id"
        placeholder="选择字段"
        class="w-35"
        :scrollHeight="dynamicScrollHeight"
        size="small"
        @click="onSelectTrigger"
        @change="onFieldChange(filter)"
      >
        <template #option="slotProps">
          <div class="flex items-center gap-2">
            <i class="pi text-gray-400 text-xs" :class="getFieldTypeIcon(slotProps.option.type)"></i>
            <span>{{ slotProps.option.name }}</span>
          </div>
        </template>
      </Select>

      <!-- 2. Operator Selector -->
      <Select
        v-model="filter.operator"
        :options="getOperators(filter.fieldId)"
        optionLabel="label"
        optionValue="value"
        placeholder="选择条件"
        class="w-30"
        :scrollHeight="dynamicScrollHeight"
        size="small"
      />

      <!-- 3. Value Input (Dynamic) -->
      <div class="flex-1">
        <!-- No value needed for 'isEmpty' / 'isNotEmpty' -->
        <div v-if="['isEmpty', 'isNotEmpty'].includes(filter.operator)" class="text-gray-400 text-sm italic px-2"></div>

        <!-- Single Select Options -->
        <Select
          v-else-if="isSingleSelectField(filter.fieldId)"
          v-model="filter.value"
          :options="getFieldOptions(filter.fieldId)"
          optionLabel="name"
          optionValue="id"
          placeholder="请选择选项"
          class="w-full"
          size="small"
          :scrollHeight="dynamicScrollHeight"
        />

        <!-- Multi Select Options -->
        <MultiSelect
          v-else-if="isMultiSelectField(filter.fieldId)"
          v-model="filter.value"
          :options="getFieldOptions(filter.fieldId)"
          optionLabel="name"
          optionValue="id"
          placeholder="请选择选项"
          class="w-full"
          size="small"
          :scrollHeight="dynamicScrollHeight"
        />

        <!-- Date Input -->
        <DatePicker
          v-else-if="isDateField(filter.fieldId)"
          v-model="filter.value"
          dateFormat="yy-mm-dd"
          placeholder="选择日期"
          class="w-full"
          size="small"
        />

        <!-- Number Input -->
        <InputNumber
          v-else-if="isNumberField(filter.fieldId)"
          v-model="filter.value"
          placeholder="输入数字"
          class="w-full"
          size="small"
          :minFractionDigits="0"
          :maxFractionDigits="4"
        />

        <!-- Text Input (Default) -->
        <InputText
          v-else
          v-model="filter.value"
          type="text"
          placeholder="请输入"
          class="w-full"
          size="small"
        />
      </div>

      <!-- Delete Button -->
      <Button
        icon="pi pi-times"
        text
        rounded
        size="small"
        severity="secondary"
        aria-label="Delete"
        @click="removeFilter(index)"
      />
    </div>

    <div class="">
      <Button
        label="添加条件"
        icon="pi pi-plus"
        text
        size="small"
        @click="addFilter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Field } from '../stores/work';
import {
  FIELD_TYPE_TEXT,
  FIELD_TYPE_NUMBER,
  FIELD_TYPE_SINGLE_SELECT,
  FIELD_TYPE_MULTI_SELECT,
  FIELD_TYPE_DATE,
  FIELD_TYPE_ATTACHMENT,
  FIELD_TYPE_URL,
  FIELD_TYPE_CHECKBOX
} from '../constants/table';
import { getFieldTypeIcon } from '../utils/field';
import isEqual from '../utils/isEqual';
import deepClone from '../utils/deepClone';
import { OPERATORS } from '../constants/filter';
import { calculateAvailableHeight } from '../utils/dom';

// Types
export interface FilterCondition {
  fieldId: string;
  operator: string;
  value: any;
}

const props = defineProps<{
  fields: Field[];
  modelValue?: FilterCondition[];
}>();

const emit = defineEmits(['update:modelValue']);

// Local state
const filters = ref<FilterCondition[]>(props.modelValue ? deepClone(props.modelValue) : []);
const dynamicScrollHeight = ref('300px');
const isHeightCalculated = ref(false);

function onSelectTrigger(event: Event) {
  if (isHeightCalculated.value) return;
  dynamicScrollHeight.value = calculateAvailableHeight(event.currentTarget);
  isHeightCalculated.value = true;
}

// Sync with prop if it changes externally
watch(() => props.modelValue, (newVal) => {
  // Avoid infinite loop by comparing content
  if (!isEqual(newVal, filters.value)) {
    filters.value = newVal ? deepClone(newVal) : [];
  }
}, { deep: true });

watch(filters, (newVal) => {
  console.log('filters changed', newVal);
  emit('update:modelValue', newVal);
}, { deep: true });

const fieldOptions = computed(() => {
  return props.fields.filter(f => !f.hidden);
});

// Helpers
function getField(fieldId: string) {
  return props.fields.find(f => f.id === fieldId);
}

function isFieldType(fieldId: string, type: string) {
  const field = getField(fieldId);
  return field?.type === type;
}

const isSingleSelectField = (id: string) => isFieldType(id, FIELD_TYPE_SINGLE_SELECT);
const isMultiSelectField = (id: string) => isFieldType(id, FIELD_TYPE_MULTI_SELECT);
const isDateField = (id: string) => isFieldType(id, FIELD_TYPE_DATE);
const isNumberField = (id: string) => isFieldType(id, FIELD_TYPE_NUMBER);

function getFieldOptions(fieldId: string) {
  const field = getField(fieldId);
  if (!field?.config?.options) return [];
  return field.config.options as Array<{ id: string; name: string }>;
}

function getOperators(fieldId: string) {
  const field = getField(fieldId);
  if (!field) return [];

  switch (field.type) {
    case FIELD_TYPE_ATTACHMENT:
      return OPERATORS.file;
    case FIELD_TYPE_DATE:
      return OPERATORS.date;
    case FIELD_TYPE_NUMBER:
      return OPERATORS.number;
    case FIELD_TYPE_CHECKBOX:
      return OPERATORS.checkbox;
    case FIELD_TYPE_TEXT:
    case FIELD_TYPE_URL:
    case FIELD_TYPE_SINGLE_SELECT:
    case FIELD_TYPE_MULTI_SELECT:
      return OPERATORS.default;
    default:
      return OPERATORS.default;
  }
}

// Actions
function addFilter() {
  // Default to first field
  const defaultField = fieldOptions.value[0];
  if (!defaultField) return;

  const op = getOperators(defaultField.id)[0].value;
  filters.value.push({
    fieldId: defaultField.id,
    operator: op,
    value: null
  });
}

function removeFilter(index: number) {
  filters.value.splice(index, 1);
}

function onFieldChange(filter: FilterCondition) {
  // Reset operator and value when field changes
  const ops = getOperators(filter.fieldId);
  filter.operator = ops[0]?.value;
  filter.value = null;
}

</script>
