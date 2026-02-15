<script setup lang="ts">
import type { FilterCondition, Field } from '~/types/table'
import {
  OPERATORS,  
  OP_IS_EMPTY, OP_IS_NOT_EMPTY, OP_IS, OP_IS_BOOLEAN
} from '~/constants/filter'
import {
  FIELD_TYPE_ATTACHMENT, FIELD_TYPE_CHECKBOX, FIELD_TYPE_NUMBER, FIELD_TYPE_DATE,
  FIELD_TYPE_SINGLE_SELECT, FIELD_TYPE_MULTI_SELECT
} from '~/constants/table'
import { getFieldTypeIcon } from '~/utils/helpers'

const props = defineProps<{
  fields: Field[]
}>()

const filters = defineModel<FilterCondition[]>({ default: () => [] })

function getOperators(field: Field | undefined) {
  if (!field) return OPERATORS.default
  switch (field.type) {
    case FIELD_TYPE_NUMBER: return OPERATORS.number
    case FIELD_TYPE_DATE: return OPERATORS.date
    case FIELD_TYPE_ATTACHMENT: return OPERATORS.file
    case FIELD_TYPE_CHECKBOX: return OPERATORS.checkbox
    default: return OPERATORS.default
  }
}

function addFilter() {
  const firstField = props.fields[0]
  if (!firstField) return
  const ops = getOperators(firstField)
  filters.value.push({
    fieldId: firstField.id,
    operator: ops[0].value,
    value: undefined
  })
}

function removeFilter(index: number) {
  filters.value.splice(index, 1)
}

function onFieldChange(index: number, fieldId: string) {
  const target = filters.value[index]
  if (!target) return
  const field = props.fields.find(f => f.id === fieldId)
  const ops = getOperators(field)
  target.fieldId = fieldId
  target.operator = ops[0].value
  target.value = undefined
}

function isEmptyOperator(op: string) {
  return op === OP_IS_EMPTY || op === OP_IS_NOT_EMPTY
}

function getFieldById(fieldId: string) {
  return props.fields.find(f => f.id === fieldId)
}

function getSelectOptions(field: Field | undefined) {
  if (!field) return []
  const opts = field.config?.options as Array<{ id: string, name: string }> ?? []
  return opts.map(o => ({ label: o.name, value: o.id }))
}

const fieldItems = computed(() =>
  props.fields.map(f => ({
    label: f.name,
    value: f.id,
    icon: getFieldTypeIcon(f.type)
  }))
)
</script>

<template>
  <div class="flex flex-col gap-2 p-3 min-w-[400px]">
    <div class="flex items-center justify-between mb-1">
      <span class="text-sm font-medium text-highlighted">筛选条件</span>
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-plus" label="添加条件" @click="addFilter" />
    </div>

    <div v-if="!filters.length" class="text-sm text-muted py-2 text-center">
      暂无筛选条件
    </div>

    <div
      v-for="(filter, index) in filters"
      :key="index"
      class="flex items-center gap-2"
    >
      <!-- Field Selector -->
      <USelect
        :model-value="filter.fieldId"
        :items="fieldItems"
        value-key="value"
        class="w-[140px]"
        size="sm"
        @update:model-value="onFieldChange(index, $event)"
      />

      <!-- Operator Selector -->
      <USelect
        v-model="filter.operator"
        :items="getOperators(getFieldById(filter.fieldId)).map(o => ({ label: o.label, value: o.value }))"
        value-key="value"
        class="w-[110px]"
        size="sm"
      />

      <!-- Value Input -->
      <template v-if="!isEmptyOperator(filter.operator)">
        <!-- Checkbox value -->
        <USelect
          v-if="filter.operator === OP_IS_BOOLEAN"
          v-model="filter.value"
          :items="[{ label: '已勾选', value: true }, { label: '未勾选', value: false }]"
          value-key="value"
          class="w-[120px]"
          size="sm"
        />

        <!-- Select value -->
        <USelectMenu
          v-else-if="getFieldById(filter.fieldId)?.type === FIELD_TYPE_SINGLE_SELECT"
          v-model="filter.value"
          :items="getSelectOptions(getFieldById(filter.fieldId))"
          value-key="value"
          placeholder="选择..."
          class="w-[140px]"
          size="sm"
        />

        <!-- Multi-select value -->
        <USelectMenu
          v-else-if="getFieldById(filter.fieldId)?.type === FIELD_TYPE_MULTI_SELECT"
          v-model="filter.value"
          :items="getSelectOptions(getFieldById(filter.fieldId))"
          multiple
          value-key="value"
          placeholder="选择..."
          class="w-[140px]"
          size="sm"
        />

        <!-- Date value -->
        <UInput
          v-else-if="getFieldById(filter.fieldId)?.type === FIELD_TYPE_DATE"
          v-model="filter.value"
          type="date"
          class="w-[140px]"
          size="sm"
        />

        <!-- Number value -->
        <UInput
          v-else-if="getFieldById(filter.fieldId)?.type === FIELD_TYPE_NUMBER"
          v-model.number="filter.value"
          type="number"
          class="w-[120px]"
          size="sm"
          placeholder="值"
        />

        <!-- Text value (default) -->
        <UInput
          v-else
          v-model="filter.value"
          class="w-[140px]"
          size="sm"
          placeholder="值"
        />
      </template>
      <div v-else class="w-[140px]" />

      <!-- Remove -->
      <UButton
        size="xs"
        variant="ghost"
        color="error"
        icon="i-lucide-x"
        @click="removeFilter(index)"
      />
    </div>

    <div v-if="filters.length" class="flex justify-end mt-1">
      <UButton size="xs" variant="ghost" color="neutral" label="清除全部" @click="filters = []" />
    </div>
  </div>
</template>
