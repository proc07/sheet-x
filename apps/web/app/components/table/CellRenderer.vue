<script setup lang="ts">
import type { Field, Attachment, UrlData } from '~/types/table'
import {
  FIELD_TYPE_DATE, FIELD_TYPE_SINGLE_SELECT, FIELD_TYPE_MULTI_SELECT,
  FIELD_TYPE_CHECKBOX, FIELD_TYPE_URL, FIELD_TYPE_ATTACHMENT,
  FIELD_TYPE_NUMBER, FIELD_TYPE_PROGRESS, FIELD_TYPE_RATING,
  FIELD_TYPE_EMAIL, FIELD_TYPE_PHONE, FIELD_TYPE_CURRENCY,
  formatDate
} from '~/constants/table'
import { getSelectOptionName, isImage, getFileIcon } from '~/utils/helpers'

const props = defineProps<{
  value: any
  field: Field
}>()

const displayValue = computed(() => {
  const { value, field } = props
  if (value === null || value === undefined || value === '') return ''

  switch (field.type) {
    case FIELD_TYPE_DATE:
      return formatDate(value, field)
    case FIELD_TYPE_NUMBER:
    case FIELD_TYPE_CURRENCY:
    case FIELD_TYPE_PROGRESS:
    case FIELD_TYPE_RATING:
      return String(value)
    case FIELD_TYPE_CHECKBOX:
      return value
    case FIELD_TYPE_EMAIL:
    case FIELD_TYPE_PHONE:
      return String(value)
    default:
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
})

const urlData = computed<UrlData | null>(() => {
  if (props.field.type !== FIELD_TYPE_URL) return null
  const v = props.value
  if (!v) return null
  if (typeof v === 'string') return { link: v, text: v }
  if (typeof v === 'object' && v.link) return v as UrlData
  return null
})

const attachments = computed<Attachment[]>(() => {
  if (props.field.type !== FIELD_TYPE_ATTACHMENT) return []
  return Array.isArray(props.value) ? props.value : []
})

const selectOptions = computed(() => {
  const v = props.value
  if (!v) return []
  if (Array.isArray(v)) return v
  return [v]
})
</script>

<template>
  <!-- Single Select -->
  <div v-if="field.type === FIELD_TYPE_SINGLE_SELECT && value" class="flex items-center gap-1 overflow-hidden">
    <UBadge variant="subtle" color="primary" size="sm">
      {{ getSelectOptionName(field, value) }}
    </UBadge>
  </div>

  <!-- Multi Select -->
  <div v-else-if="field.type === FIELD_TYPE_MULTI_SELECT && selectOptions.length" class="flex flex-wrap items-center gap-1 overflow-hidden">
    <UBadge v-for="opt in selectOptions" :key="opt" variant="subtle" color="primary" size="sm">
      {{ getSelectOptionName(field, opt) }}
    </UBadge>
  </div>

  <!-- Checkbox -->
  <div v-else-if="field.type === FIELD_TYPE_CHECKBOX" class="flex items-center">
    <UIcon :name="value ? 'i-lucide-square-check' : 'i-lucide-square'" class="size-4" :class="value ? 'text-primary' : 'text-muted'" />
  </div>

  <!-- URL -->
  <div v-else-if="field.type === FIELD_TYPE_URL && urlData" class="truncate">
    <a
      :href="urlData.link"
      target="_blank"
      class="text-primary hover:underline truncate"
      @click.stop
    >
      {{ urlData.text || urlData.link }}
    </a>
  </div>

  <!-- Attachment -->
  <div v-else-if="field.type === FIELD_TYPE_ATTACHMENT && attachments.length" class="flex items-center gap-1 overflow-hidden">
    <template v-for="(file, i) in attachments.slice(0, 3)" :key="i">
      <img v-if="isImage(file)" :src="file.url" class="size-5 rounded object-cover" :alt="file.name">
      <UIcon v-else :name="getFileIcon(file)" class="size-4" />
    </template>
    <span v-if="attachments.length > 3" class="text-xs text-muted">
      +{{ attachments.length - 3 }}
    </span>
  </div>

  <!-- Date -->
  <div v-else-if="field.type === FIELD_TYPE_DATE" class="truncate text-sm">
    {{ displayValue }}
  </div>

  <!-- Default (Text, Number, etc.) -->
  <div v-else class="truncate text-sm">
    {{ displayValue }}
  </div>
</template>
