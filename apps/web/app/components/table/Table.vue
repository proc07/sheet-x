<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import type { Field, RecordRow, FilterCondition } from '~/types/table'
import {
  FIELD_TYPE_CHECKBOX, FIELD_TYPE_URL, FIELD_TYPE_ATTACHMENT,
  fieldTypeMeta, formatDate, DEFAULT_FIELD_WIDTH,
  FIELD_TYPE_DATE, FIELD_TYPE_SINGLE_SELECT, FIELD_TYPE_MULTI_SELECT,
  statOptions, STAT_NONE
} from '~/constants/table'
import { getSelectOptionName, isImage, getFileIcon, getFieldTypeIcon } from '~/utils/helpers'

const props = defineProps<{
  records: RecordRow[]
  fields: Field[]
  loading: boolean
  rowHeight: number
  filters: FilterCondition[]
  editingCell: { recordId: string, fieldId: string } | null
  editingValue: any
  selectedRows: Record<string, boolean>
  fieldFormVisible: boolean
  editingField: Field | null
}>()

const emit = defineEmits<{
  'start-edit': [recordId: string, fieldId: string, value: any]
  'commit-edit': []
  'cancel-edit': []
  'update-editing-value': [value: any]
  'add-record': []
  'insert-record': [position: number]
  'delete-records': [ids: string[]]
  'toggle-row-selection': [id: string, selected?: boolean]
  'toggle-all-rows': [records: RecordRow[], selected: boolean]
  'open-field-form': [field?: Field]
  'close-field-form': []
  'create-field': [data: { name: string, type: any, config: any }]
  'update-field': [fieldId: string, data: { name: string, type: any, config: any }]
  'context-menu': [record: RecordRow, rowIndex: number]
  'update:filters': [filters: FilterCondition[]]
  'toggle-visibility': [fieldId: string]
  'set-row-height': [value: number]
  'reorder-fields': [ids: string[]]
  'select-stat': [fieldId: string, type: string]
  'field-menu-action': [action: string, field: Field]
}>()

const UCheckbox = resolveComponent('UCheckbox')
const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UPopover = resolveComponent('UPopover')

const table = useTemplateRef('table')

// ── Tanstack Columns ─────────────────────────────────────────
const columns = computed<TableColumn<RecordRow>[]>(() => {
  const visibleFields = props.fields
    .filter(f => !f.hidden)
    .sort((a, b) => a.position - b.position)

  const cols: TableColumn<RecordRow>[] = []

  // Selection column
  cols.push({
    id: 'select',
    header: ({ table: t }) =>
      h(UCheckbox, {
        'modelValue': t.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : t.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          emit('toggle-all-rows', props.records, !!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': props.selectedRows[row.original.id] ?? false,
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          emit('toggle-row-selection', row.original.id, !!value),
        'ariaLabel': 'Select row'
      })
  })

  // Data columns
  for (const field of visibleFields) {
    cols.push({
      id: field.id,
      accessorFn: (row: RecordRow) => row.data[field.id],
      header: () => {
        const fieldMenuItems = [
          {
            label: '编辑字段',
            icon: 'i-lucide-pencil',
            onSelect: () => emit('open-field-form', field)
          },
          { type: 'separator' as const },
          {
            label: field.frozen ? '取消冻结' : '冻结列',
            icon: field.frozen ? 'i-lucide-unlock' : 'i-lucide-lock',
            onSelect: () => emit('field-menu-action', 'freeze', field)
          },
          {
            label: '隐藏字段',
            icon: 'i-lucide-eye-off',
            onSelect: () => emit('toggle-visibility', field.id)
          },
          { type: 'separator' as const },
          {
            label: '删除字段',
            icon: 'i-lucide-trash',
            color: 'error' as const,
            onSelect: () => emit('field-menu-action', 'delete', field)
          }
        ]

        return h('div', { class: 'flex items-center gap-1.5 w-full justify-between group' }, [
          h('div', { class: 'flex items-center gap-1.5 min-w-0' }, [
            h(UIcon, { name: getFieldTypeIcon(field.type), class: 'size-3.5 shrink-0 text-muted' }),
            h('span', { class: 'truncate text-highlighted font-medium' }, field.name)
          ]),
          h(UDropdownMenu, {
            items: fieldMenuItems,
            content: { align: 'start' }
          }, () =>
            h(UButton, {
              icon: 'i-lucide-chevron-down',
              size: '2xs',
              variant: 'ghost',
              color: 'neutral',
              class: 'opacity-0 group-hover:opacity-100 transition-opacity shrink-0'
            })
          )
        ])
      },
      cell: ({ row }) => {
        const recordId = row.original.id
        const value = row.original.data[field.id]
        const isEditing = props.editingCell?.recordId === recordId
          && props.editingCell?.fieldId === field.id

        if (isEditing) {
          return h(resolveComponent('TableCellEditor'), {
            modelValue: props.editingValue,
            field,
            'onUpdate:modelValue': (v: any) => emit('update-editing-value', v),
            'onCommit': () => emit('commit-edit')
          })
        }

        return h('div', {
          class: 'cursor-pointer min-h-[24px] flex items-center w-full',
          onClick: () => emit('start-edit', recordId, field.id, value)
        }, [
          h(resolveComponent('TableCellRenderer'), {
            value,
            field
          })
        ])
      }
    })
  }

  // Add field column
  cols.push({
    id: 'add-field',
    header: () =>
      h(UButton, {
        icon: 'i-lucide-plus',
        size: '2xs',
        variant: 'ghost',
        color: 'neutral',
        onClick: () => emit('open-field-form')
      }),
    cell: () => h('div')
  })

  return cols
})

// ── Row context menu ─────────────────────────────────────────
function getRowContextItems(row: Row<RecordRow>) {
  const record = row.original
  const rowIndex = row.index
  const selectedIds = Object.entries(props.selectedRows)
    .filter(([, v]) => v)
    .map(([id]) => id)
  const count = selectedIds.length

  return [
    {
      label: '复制行 ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(record.id)
      }
    },
    { type: 'separator' as const },
    {
      label: '在上方插入行',
      icon: 'i-lucide-arrow-up',
      onSelect: () => emit('insert-record', rowIndex)
    },
    {
      label: '在下方插入行',
      icon: 'i-lucide-arrow-down',
      onSelect: () => emit('insert-record', rowIndex + 1)
    },
    { type: 'separator' as const },
    {
      label: count > 1 ? `删除 ${count} 行` : '删除行',
      icon: 'i-lucide-trash',
      color: 'error' as const,
      onSelect() {
        const ids = count > 0 ? selectedIds : [record.id]
        emit('delete-records', ids)
      }
    }
  ]
}

// ── Filter model ─────────────────────────────────────────────
const localFilters = computed({
  get: () => props.filters,
  set: v => emit('update:filters', v)
})
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <!-- Toolbar -->
    <TableToolbar
      :fields="fields"
      :row-height="rowHeight"
      :filter-count="filters.length"
      @add-record="emit('add-record')"
      @add-field="emit('open-field-form')"
      @toggle-visibility="emit('toggle-visibility', $event)"
      @set-row-height="emit('set-row-height', $event)"
      @reorder-fields="emit('reorder-fields', $event)"
    >
      <template #filter-content>
        <TableFilter v-model="localFilters" :fields="fields" />
      </template>
    </TableToolbar>

    <!-- Table -->
    <UTable
      ref="table"
      class="shrink-0 flex-1"
      :data="records"
      :columns="columns"
      :loading="loading"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-1.5 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default py-0.5 px-2',
        separator: 'h-0'
      }"
    >
      <template #actions-data="{ row }">
        <div class="text-right">
          <UDropdownMenu
            :content="{ align: 'end' }"
            :items="getRowContextItems(row)"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="2xs"
            />
          </UDropdownMenu>
        </div>
      </template>
    </UTable>

    <!-- Field Form Modal -->
    <UModal :open="fieldFormVisible" @update:open="(v) => { if (!v) emit('close-field-form') }">
      <template #content>
        <TableFieldForm
          :editing-field="editingField"
          @submit="(data) => {
            if (editingField) {
              emit('update-field', editingField.id, data)
            } else {
              emit('create-field', data)
            }
          }"
          @cancel="emit('close-field-form')"
        />
      </template>
    </UModal>
  </div>
</template>
