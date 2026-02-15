<script setup lang="ts">
import type { Field, FieldType } from '~/types/table'
import {
  fieldTypeOptions, dateFormatOptions, numberFormatOptions,
  FIELD_TYPE_SINGLE_SELECT, FIELD_TYPE_MULTI_SELECT,
  FIELD_TYPE_DATE, FIELD_TYPE_NUMBER, FIELD_TYPE_FORMULA, FIELD_TYPE_LOOKUP,
  FIELD_TYPE_USER
} from '~/constants/table'
import { getFieldTypeIcon, defaultOptionsForField } from '~/utils/helpers'

const props = defineProps<{
  editingField?: Field | null
}>()

const emit = defineEmits<{
  'submit': [data: { name: string, type: FieldType, config: any }]
  'cancel': []
}>()

const form = reactive({
  name: '',
  type: 'TEXT' as FieldType,
  config: {} as any
})

// Map field type options for flat list
const allFieldTypes = computed(() =>
  fieldTypeOptions.flatMap(group =>
    group.items.map(item => ({
      ...item,
      group: group.label
    }))
  )
)

// ── Type Checks ──────────────────────────────────────────────
const isSelect = computed(() =>
  form.type === FIELD_TYPE_SINGLE_SELECT || form.type === FIELD_TYPE_MULTI_SELECT
)
const isDate = computed(() => form.type === FIELD_TYPE_DATE)
const isNumber = computed(() => form.type === FIELD_TYPE_NUMBER)
const isFormula = computed(() => form.type === FIELD_TYPE_FORMULA)
const isLookup = computed(() => form.type === FIELD_TYPE_LOOKUP)
const isUser = computed(() => form.type === FIELD_TYPE_USER)

// Init from editing field
watchEffect(() => {
  if (props.editingField) {
    form.name = props.editingField.name
    form.type = props.editingField.type
    form.config = { ...(props.editingField.config || {}) }
  }
  else {
    form.name = ''
    form.type = 'TEXT'
    form.config = {}
  }
})

// Adjust config when type changes
watch(() => form.type, (type) => {
  if (!props.editingField) {
    form.config = defaultOptionsForField(type) ?? {}
  }
})

// ── Select options management ────────────────────────────────
const selectOptions = computed({
  get: () => form.config.options ?? [{ id: 'opt1', name: '选项1' }, { id: 'opt2', name: '选项2' }],
  set: v => (form.config.options = v)
})

function addOption() {
  const id = `opt_${Date.now()}`
  selectOptions.value = [...selectOptions.value, { id, name: `选项${selectOptions.value.length + 1}` }]
}

function removeOption(index: number) {
  const opts = [...selectOptions.value]
  opts.splice(index, 1)
  selectOptions.value = opts
}

function submit() {
  if (!form.name.trim()) return
  emit('submit', {
    name: form.name.trim(),
    type: form.type,
    config: form.config
  })
}
</script>

<template>
  <div class="flex flex-col gap-4 p-4 min-w-[360px]">
    <h3 class="text-base font-semibold text-highlighted">
      {{ editingField ? '编辑字段' : '新建字段' }}
    </h3>

    <!-- Name -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted font-medium">字段名称</label>
      <UInput v-model="form.name" placeholder="请输入字段名称" autofocus />
    </div>

    <!-- Type -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted font-medium">字段类型</label>
      <USelect
        v-model="form.type"
        :items="allFieldTypes"
        value-key="value"
        :disabled="!!editingField"
      />
    </div>

    <!-- Select Options Config -->
    <div v-if="isSelect" class="flex flex-col gap-2">
      <label class="text-xs text-muted font-medium">选项配置</label>
      <div
        v-for="(opt, idx) in selectOptions"
        :key="opt.id"
        class="flex items-center gap-2"
      >
        <UInput
          v-model="opt.name"
          size="sm"
          class="flex-1"
          :placeholder="`选项 ${idx + 1}`"
        />
        <UButton
          size="xs"
          variant="ghost"
          color="error"
          icon="i-lucide-x"
          :disabled="selectOptions.length <= 1"
          @click="removeOption(idx)"
        />
      </div>
      <UButton size="xs" variant="ghost" color="primary" icon="i-lucide-plus" label="添加选项" @click="addOption" />
    </div>

    <!-- Date Format -->
    <div v-if="isDate" class="flex flex-col gap-1">
      <label class="text-xs text-muted font-medium">日期格式</label>
      <USelect
        v-model="form.config.dateFormat"
        :items="dateFormatOptions"
        value-key="value"
      />
    </div>

    <!-- Number Format -->
    <div v-if="isNumber" class="flex flex-col gap-1">
      <label class="text-xs text-muted font-medium">数字格式</label>
      <USelect
        v-model="form.config.numberFormat"
        :items="numberFormatOptions"
        value-key="value"
      />
    </div>

    <!-- Formula -->
    <div v-if="isFormula" class="flex flex-col gap-1">
      <label class="text-xs text-muted font-medium">公式</label>
      <UTextarea
        v-model="form.config.formula"
        :rows="3"
        placeholder="请输入公式"
      />
    </div>

    <!-- Lookup -->
    <div v-if="isLookup" class="flex flex-col gap-1">
      <label class="text-xs text-muted font-medium">查找引用配置</label>
      <UInput
        v-model="form.config.lookupTableId"
        size="sm"
        placeholder="关联表 ID"
      />
      <UInput
        v-model="form.config.lookupFieldId"
        size="sm"
        placeholder="关联字段 ID"
        class="mt-1"
      />
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 pt-2 border-t border-default">
      <UButton label="取消" variant="ghost" color="neutral" @click="emit('cancel')" />
      <UButton
        :label="editingField ? '保存' : '创建'"
        :disabled="!form.name.trim()"
        @click="submit"
      />
    </div>
  </div>
</template>
