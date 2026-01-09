<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div class="flex items-center gap-2">
        <h2 class="m-0">Table</h2>
        <Tag :value="resolvedTableId" />
      </div>
      <div class="flex gap-2">
      </div>
    </div>

    <div class=" overflow-hidden mb-3">
      <div class="flex items-center gap-2 border-b border-slate-200/80 px-3 py-2 text-sm overflow-x-auto">
        <button
          v-for="view in viewTabs"
          :key="view.id"
          type="button"
          class="flex items-center gap-2 rounded-md px-2.5 py-1 transition"
          :class="activeView === view.id ? 'bg-slate-900/5 text-slate-900' : 'text-slate-500 hover:bg-slate-100'"
          @click="activeView = view.id"
        >
          <i :class="view.icon"></i>
          <span>{{ view.label }}</span>
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200/80 px-3 py-2 text-sm">
        <button
          v-for="action in toolbarActions"
          :key="action.label"
          type="button"
          class="flex items-center gap-2 rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
          @click="action.action?.()"
        >
          <i :class="action.icon"></i>
          <span>{{ action.label }}</span>
        </button>
      </div>

      <div class="px-3 py-3">
        <div class="flex flex-wrap items-center gap-2">
          <InputText v-model="newFieldName" placeholder="字段名" class="w-48" />
          <Dropdown
            v-model="newFieldType"
            :options="fieldTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="字段类型"
            class="w-48"
          />
          <Button label="添加字段" @click="createField" />
        </div>

        <div class="mt-3 flex flex-wrap">
          <Tag
            v-for="f in work.fields"
            :key="f.id"
            class="mr-2 mb-2"
            :value="`${f.name} (${f.type})`"
          />
        </div>
      </div>
    </div>

    <div class=" p-2">
      <DataTable :value="work.records" class="w-full" showGridlines>
        <Column field="id" header="Record" :style="{ width: '220px' }" />

        <Column
          v-for="field in work.fields"
          :key="field.id"
          :header="field.name"
          :style="{ minWidth: '180px' }"
        >
          <template #body="{ data }">
            <CellEditor
              :field="field"
              :record="data"
              @update="onUpdateCell"
            />
          </template>
        </Column>

        <Column header="操作" :style="{ width: '140px' }">
          <template #body="{ data }">
            <Button size="small" severity="danger" label="删除" @click="remove(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Message v-if="error" severity="error" :closable="false" class="mt-3  px-3 py-2">
      {{ error }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkStore, type Field, type RecordRow } from '../stores/work';
import CellEditor from './components/CellEditor.vue';
import { defaultOptionsForField } from '../utils/field';

const props = defineProps<{ tableId?: string }>();

const route = useRoute();
const router = useRouter();
const work = useWorkStore();

const resolvedTableId = computed(() => props.tableId ?? (route.params.tableId as string) ?? '');

const newFieldName = ref('');
const newFieldType = ref<Field['type']>('TEXT');

const error = ref('');

const fieldTypeOptions = [
  { label: '文本', value: 'TEXT' },
  { label: '数字', value: 'NUMBER' },
  { label: '日期', value: 'DATE' },
  { label: '单选', value: 'SINGLE_SELECT' },
  { label: '多选', value: 'MULTI_SELECT' },
];

const viewTabs = [
  { id: 'grid', label: '表格', icon: 'pi pi-table' },
  { id: 'board', label: '看板', icon: 'pi pi-window-maximize' },
  { id: 'map', label: '地图视图', icon: 'pi pi-map' },
  { id: 'print', label: '排版打印', icon: 'pi pi-print' },
  { id: 'form', label: '表单', icon: 'pi pi-file' },
];

const activeView = ref('grid');

const toolbarActions = [
  { label: '添加记录', icon: 'pi pi-plus', action: createRecord },
  { label: '字段配置', icon: 'pi pi-sliders-h' },
  { label: '视图配置', icon: 'pi pi-th-large' },
  { label: '筛选', icon: 'pi pi-filter' },
  { label: '分组', icon: 'pi pi-sitemap' },
  { label: '排序', icon: 'pi pi-sort-amount-down' },
  { label: '行高', icon: 'pi pi-bars' },
];

watch(
  () => resolvedTableId.value,
  async (tableId) => {
    if (!tableId) return;
    await reload();
  },
  { immediate: true }
);

async function reload() {
  const tableId = resolvedTableId.value;
  if (!tableId) return;
  error.value = '';
  try {
    await work.loadFields(tableId);
    await work.loadRecords(tableId);
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? '加载失败';
  }
}

async function createField() {
  const tableId = resolvedTableId.value;
  if (!tableId) return;
  if (!newFieldName.value.trim()) return;
  const options = defaultOptionsForField(newFieldType.value);
  await work.createField(tableId, { name: newFieldName.value.trim(), type: newFieldType.value, options });
  newFieldName.value = '';
}

async function createRecord() {
  const tableId = resolvedTableId.value;
  if (!tableId) return;
  await work.createRecord(tableId);
}

async function onUpdateCell(payload: { recordId: string; revision: number; fieldId: string; value: any }) {
  error.value = '';
  try {
    await work.patchRecord(payload.recordId, payload.revision, { [payload.fieldId]: payload.value });
  } catch (e: any) {
    const msg = e?.response?.data?.message ?? '更新失败';
    // 409 revision conflict
    error.value = typeof msg === 'string' ? msg : '更新失败（可能有冲突，请刷新）';
  }
}

async function remove(recordId: string) {
  await work.deleteRecord(recordId);
}
</script>
