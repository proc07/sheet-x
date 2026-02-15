<script setup lang="ts">
import type { Field, FilterCondition } from '~/types/table'
import { rowHeightOptions } from '~/constants/table'
import { getFieldTypeIcon } from '~/utils/helpers'

const props = defineProps<{
  fields: Field[]
  rowHeight: number
  filterCount: number
}>()

const emit = defineEmits<{
  'add-record': []
  'add-field': []
  'toggle-visibility': [fieldId: string]
  'toggle-freeze': [fieldId: string]
  'set-row-height': [value: number]
  'open-filter': []
  'reorder-fields': [ids: string[]]
}>()

// ── Field Visibility Menu ────────────────────────────────────
const fieldVisibilityItems = computed(() =>
  props.fields.map(f => ({
    label: f.name,
    icon: getFieldTypeIcon(f.type),
    type: 'checkbox' as const,
    checked: !f.hidden,
    onUpdateChecked() {
      emit('toggle-visibility', f.id)
    },
    onSelect(e?: Event) {
      e?.preventDefault()
    }
  }))
)

// ── Row Height Menu ──────────────────────────────────────────
const rowHeightItems = computed(() =>
  rowHeightOptions.map(opt => ({
    label: opt.label,
    icon: opt.icon,
    onSelect: () => emit('set-row-height', opt.value)
  }))
)

// ── Drag and Drop for Reorder ────────────────────────────────
const dragFieldId = ref<string | null>(null)

function onDragStart(fieldId: string) {
  dragFieldId.value = fieldId
}

function onDrop(targetFieldId: string) {
  if (!dragFieldId.value || dragFieldId.value === targetFieldId) return
  const ids = props.fields
    .filter(f => !f.hidden)
    .sort((a, b) => a.position - b.position)
    .map(f => f.id)

  const fromIdx = ids.indexOf(dragFieldId.value)
  const toIdx = ids.indexOf(targetFieldId)
  if (fromIdx < 0 || toIdx < 0) return

  ids.splice(fromIdx, 1)
  ids.splice(toIdx, 0, dragFieldId.value)
  emit('reorder-fields', ids)
  dragFieldId.value = null
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-1.5">
    <div class="flex items-center gap-1.5">
      <!-- Add Record -->
      <UButton
        icon="i-lucide-plus"
        label="添加记录"
        size="sm"
        @click="emit('add-record')"
      />
    </div>

    <div class="flex flex-wrap items-center gap-1.5">
      <!-- Filter -->
      <UPopover :content="{ side: 'bottom', align: 'end' }">
        <UButton
          icon="i-lucide-filter"
          label="筛选"
          variant="outline"
          color="neutral"
          size="sm"
        >
          <template v-if="filterCount > 0" #trailing>
            <UBadge :label="String(filterCount)" size="xs" variant="subtle" color="primary" />
          </template>
        </UButton>

        <template #content>
          <slot name="filter-content" />
        </template>
      </UPopover>

      <!-- Field Config -->
      <UDropdownMenu
        :items="fieldVisibilityItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="i-lucide-settings-2"
          label="字段"
          variant="outline"
          color="neutral"
          size="sm"
        />
      </UDropdownMenu>

      <!-- Row Height -->
      <UDropdownMenu
        :items="rowHeightItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="i-lucide-rows-3"
          label="行高"
          variant="outline"
          color="neutral"
          size="sm"
        />
      </UDropdownMenu>

      <!-- Sort (placeholder) -->
      <UButton
        icon="i-lucide-arrow-up-down"
        label="排序"
        variant="outline"
        color="neutral"
        size="sm"
        disabled
      />

      <!-- Group (placeholder) -->
      <UButton
        icon="i-lucide-group"
        label="分组"
        variant="outline"
        color="neutral"
        size="sm"
        disabled
      />
    </div>
  </div>
</template>
