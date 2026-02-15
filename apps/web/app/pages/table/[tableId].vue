<script setup lang="ts">
import Table from '~/components/table/Table.vue'
import { useTableFields } from '~/composables/table/useTableFields'
import { useTableFilter } from '~/composables/table/useTableFilter'
import { useTableLayout } from '~/composables/table/useTableLayout'
import { useTableRecords } from '~/composables/table/useTableRecords'
import { useTableSelection } from '~/composables/table/useTableSelection'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const tableId = computed(() => route.params.tableId as string)

const store = useWorkStore()

// ── Composables ──────────────────────────────────────────────
const {
  visibleFields, fieldFormVisible, editingField,
  openFieldForm, closeFieldForm,
  createField, updateFieldConfig, deleteField,
  toggleFieldVisibility, toggleFieldFreeze,
  reorderFields
} = useTableFields(tableId)

const { filters, filteredRecords } = useTableFilter(
  computed(() => store.records),
  computed(() => store.fields)
)
const { rowHeight, setRowHeight } = useTableLayout()

const {
  editingCell, editingValue,
  startEdit, cancelEdit, commitEdit,
  addRecord, insertRecord, deleteRecords
} = useTableRecords(tableId)

const {
  selectedRows, toggleRowSelection, toggleAllRows, clearSelection
} = useTableSelection(tableId, insertRecord, deleteRecords)

// ── Load Data ────────────────────────────────────────────────
const tableLoading = ref(false)

async function loadTableData() {
  if (!tableId.value) return
  tableLoading.value = true
  try {
    await Promise.all([
      store.loadFields(tableId.value),
      store.loadRecords(tableId.value),
      store.loadTableAcl(tableId.value)
    ])
  } finally {
    tableLoading.value = false
  }
}

watch(tableId, loadTableData, { immediate: true })

// ── Event Handlers ───────────────────────────────────────────
function onCreateField(data: { name: string, type: any, config: any }) {
  createField(data.name, data.type, data.config)
}

function onUpdateField(fieldId: string, data: { name: string, type: any, config: any }) {
  updateFieldConfig(fieldId, { name: data.name, config: data.config })
}

function onFieldMenuAction(action: string, field: any) {
  switch (action) {
    case 'freeze':
      toggleFieldFreeze(field.id)
      break
    case 'delete':
      deleteField(field.id)
      break
  }
}

function onUpdateEditingValue(value: any) {
  editingValue.value = value
}

function onDeleteRecords(ids: string[]) {
  deleteRecords(ids).then(() => clearSelection())
}

useSeoMeta({
  title: 'Sheet-X 多维表格'
})
</script>

<template>
  <UDashboardPanel id="table">
    <template #header>
      <UDashboardNavbar title="多维表格">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <Table
        :records="filteredRecords"
        :fields="store.fields"
        :loading="tableLoading"
        :row-height="rowHeight"
        :filters="filters ?? []"
        :editing-cell="editingCell"
        :editing-value="editingValue"
        :selected-rows="selectedRows"
        :field-form-visible="fieldFormVisible"
        :editing-field="editingField"
        @start-edit="startEdit"
        @commit-edit="commitEdit"
        @cancel-edit="cancelEdit"
        @update-editing-value="onUpdateEditingValue"
        @add-record="addRecord()"
        @insert-record="insertRecord"
        @delete-records="onDeleteRecords"
        @toggle-row-selection="toggleRowSelection"
        @toggle-all-rows="toggleAllRows"
        @open-field-form="openFieldForm"
        @close-field-form="closeFieldForm"
        @create-field="onCreateField"
        @update-field="onUpdateField"
        @update:filters="(v) => filters = v"
        @toggle-visibility="toggleFieldVisibility"
        @set-row-height="setRowHeight"
        @reorder-fields="reorderFields"
        @field-menu-action="onFieldMenuAction"
      />
    </template>
  </UDashboardPanel>
</template>
