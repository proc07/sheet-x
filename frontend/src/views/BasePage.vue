<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="relative flex items-center gap-2 bg-slate-50/80 pr-2 shrink-0">
        <button
          type="button"
          class="h-full w-10 absolute z-11 bg-gradient-to-right-f8f9fb self-center transition"
          v-show="canScrollLeft"
          aria-label="滚动到开头"
        >
          <i @click="scrollTabsToStart" class="pi pi-caret-left rounded-md hover:bg-slate-200 p-1"></i>
        </button>
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <div ref="tabScroll" class="tab-scroll min-w-0 flex-1 overflow-x-auto" @scroll="updateScrollState">
            <div class="flex items-center whitespace-nowrap pr-2" role="tablist" aria-label="表格列表">
              <template v-for="(table, index) in work.tables" :key="table.id">
                <button
                  type="button"
                  role="tab"
                  :data-table-id="table.id"
                  :aria-selected="table.id === activeTableId"
                  class="cursor-pointer relative inline-flex items-center gap-2 px-4 py-2 font-medium transition-colors border border-transparent group hover:border-slate-200/80 hover:border-b-0 hover:rounded-b-none"
                  :class="table.id === activeTableId
                    ? 'bg-white text-slate-900 border-slate-200/80 border-b-0 rounded-t-lg rounded-b-none shadow-sm z-10 after:absolute after:left-0 after:right-0 after:-bottom-px after:h-px after:bg-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/60 rounded-md'"
                  @click="setActiveTable(table.id)"
                  @dblclick.stop="startEditing(table)"
                >
                  <template v-if="editingTableId === table.id">
                    <input
                      :ref="setEditingInputRef"
                      v-model="editingName"
                      type="text"
                      class="h-5 w-35 rounded-md border border-slate-200/80 bg-white px-2 text-slate-700 focus:border-slate-400 focus:outline-none"
                      @click.stop
                      @keydown.enter.prevent="commitEditing"
                      @keydown.esc.prevent="cancelEditing"
                      @blur="commitEditing"
                    />
                  </template>
                  <template v-else>
                    <i
                      class="pi pi-table transition-colors"
                      :class="table.id === activeTableId ? 'text-green-500' : 'text-slate-400 group-hover:text-green-500'"
                    ></i>
                    <span class="max-w-40 truncate">{{ table.name }}</span>
                    <Button
                      v-if="table.id === activeTableId && editingTableId !== table.id"
                      class="w-5! h-5!"
                      icon="pi pi-ellipsis-h"
                      text
                      rounded
                      size="small"
                      aria-label="表格操作"
                      @click.stop="openTableMenu($event, table)"
                    />
                  </template>
                </button>
                <span v-if="index < work.tables.length - 1" class="mx-2 h-4 flex-[0_0_1px] w-px bg-slate-200/80"></span>
              </template>
              <div class="flex items-center" v-if="!tabsOverflow">
                <span class="mx-2 h-4 flex-[0_0_1px] w-px bg-slate-200/80"></span>
                <button
                  type="button"
                  class="h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                  aria-label="新增表格"
                  @click="toggleCreatePopover"
                >
                  <i class="pi pi-plus"></i>
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="h-8 w-8 self-center transition"
            v-show="canScrollRight"
            aria-label="滚动到末尾"
          >
            <i @click="scrollTabsToEnd" class="pi pi-caret-right rounded-md hover:bg-slate-200 p-1"></i>
          </button>
        </div>
        <div
          v-if="tabsOverflow"
          class="h-[28px] flex items-center rounded-md border border-b-0 border-slate-200/80 bg-white/90 shadow-sm"
        >
          <button
            type="button"
            class="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-800"
            @click="toggleAllViewsPopover"
          >
            <span>全部视图</span>
            <i class="pi pi-angle-down text-[11px]"></i>
          </button>
          <span class="mx-1 h-4 w-px bg-slate-200/80"></span>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-label="新增表格"
            @click="toggleCreatePopover"
          >
            <i class="pi pi-plus"></i>
          </button>
        </div>
      </div>

      <div v-if="activeTable" class="flex-1 min-h-0 overflow-hidden bg-white">
        <TablePage :table-id="activeTable.id" :key="activeTable.id" />
      </div>
    </div>

    <Message
      v-if="work.tables.length === 0"
      severity="info"
      :closable="false"
      class="m-3"
    >
      当前 Base 还没有表格，点击右上角 + 新建。
    </Message>

    <Popover ref="createPopover">
      <div class="flex flex-col gap-2 w-60">
        <InputText
          v-model="newTable"
          placeholder="新建表格名称"
          @keydown.enter.prevent="createTable"
        />
        <div class="flex items-center justify-end gap-2">
          <Button label="取消" text severity="secondary" @click="closeCreatePopover" />
          <Button label="创建" @click="createTable" />
        </div>
      </div>
    </Popover>

    <Popover ref="allViewsPopover" :pt="{ content: { class: 'p-0!' } }">
      <div class="w-64">
        <Listbox
          :modelValue="activeTableId"
          :options="work.tables"
          optionLabel="name"
          optionValue="id"
          filter
          filterPlaceholder="搜索视图"
          emptyMessage="暂无视图"
          class="w-full border-0!"
          @update:modelValue="selectTableFromList"
        >
        <i class="pi pi-table transition-colors" :class="'text-green-500'"></i>
      </Listbox>
      </div>
    </Popover>

    <ConfirmDialog />
    <Menu ref="tableMenu" :model="tableMenuItems" popup />
  </div>
</template>

<script setup lang="ts">
import type { VNodeRef } from 'vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkStore, type Table } from '../stores/work';
import TablePage from './TablePage.vue';
import { useConfirm } from 'primevue/useconfirm';

const confirm = useConfirm();

const route = useRoute();
const router = useRouter();
const work = useWorkStore();

const baseId = computed(() => (route.params.baseId as string) || '');
const tableIdFromQuery = computed(() => {
  const queryValue = route.query.table;
  if (Array.isArray(queryValue)) return queryValue[0] ?? '';
  return typeof queryValue === 'string' ? queryValue : '';
});
const newTable = ref('');
const activeTableId = ref('');
const createPopover = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null);
const allViewsPopover = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null);
const tableMenu = ref<{ toggle: (event: Event) => void } | null>(null);
const menuTable = ref<Table | null>(null);
const activeTable = computed(() => work.tables.find((table) => table.id === activeTableId.value) ?? null);
const tabScroll = ref<HTMLDivElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const tabsOverflow = ref(false);
const editingTableId = ref('');
const editingName = ref('');
const editingOriginalName = ref('');
const editingInput = ref<HTMLInputElement | null>(null);
const editingSaving = ref(false);

onMounted(async () => {
  await reload();
  await nextTick();
  updateScrollState();
  window.addEventListener('resize', updateScrollState);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollState);
});

watch(
  baseId,
  async (id, prevId) => {
    if (id === prevId) return;
    resetEditing();
    activeTableId.value = '';
    work.tables = [];
    if (!id) {
      await nextTick();
      updateScrollState();
      return;
    }
    await reload();
  }
);

watch(
  () => work.currentWorkspaceId,
  async (id, prevId) => {
    if (!id || id === prevId) return;
    resetEditing();
    activeTableId.value = '';
    work.tables = [];
    await nextTick();
    updateScrollState();
  }
);

watch(
  () => [work.tables, tableIdFromQuery.value],
  async () => {
    const queryId = tableIdFromQuery.value;
    if (queryId && work.tables.some((table) => table.id === queryId)) {
      activeTableId.value = queryId;
    } else if (!activeTableId.value || !work.tables.some((table) => table.id === activeTableId.value)) {
      activeTableId.value = work.tables[0]?.id ?? '';
    }
    if (editingTableId.value && !work.tables.some((table) => table.id === editingTableId.value)) {
      resetEditing();
    }
    await nextTick();
    updateScrollState();
  },
  { immediate: true }
);

watch(
  () => activeTableId.value,
  (tableId) => {
    const queryId = tableIdFromQuery.value;
    if (tableId && tableId !== queryId) {
      router.replace({ query: { ...route.query, table: tableId } });
      return;
    }
    if (!tableId && queryId && work.tables.length > 0) {
      const nextQuery = { ...route.query } as Record<string, any>;
      delete nextQuery.table;
      router.replace({ query: nextQuery });
    }
  }
);

const tableMenuItems = computed(() => [
  { label: '设置为首个标签页', icon: 'pi pi-arrow-left', disabled: true },
  { label: '重命名', icon: 'pi pi-pencil', command: () => startEditing(menuTable.value!) },
  { label: '复制表格', icon: 'pi pi-copy', disabled: true },
  { label: '保护表格', icon: 'pi pi-lock', disabled: true },
  { separator: true },
  { label: '删除表格', icon: 'pi pi-trash', command: () => {
    const table = menuTable.value;
    if (!table) return;
    confirm.require({
      message: `确认要删除视图 "${table.name}" 吗？此操作无法撤销。`,
      header: '删除表格',
      acceptLabel: '删除',
      rejectLabel: '取消',
      rejectClass: 'p-button-secondary',
      acceptClass: 'p-button-danger',
      accept: async () => {
        try {
          await work.deleteTable(table.id);
          if (activeTableId.value === table.id) {
            activeTableId.value = '';
          }
          menuTable.value = null;
        } catch (error) {
          console.error('Failed to delete table', error);
        }
      },
    });
  }},
]);

function updateScrollState() {
  const el = tabScroll.value;
  if (!el) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    tabsOverflow.value = false;
    return;
  }
  const maxScrollLeft = el.scrollWidth - el.clientWidth;
  canScrollLeft.value = el.scrollLeft > 0;
  canScrollRight.value = el.scrollLeft < maxScrollLeft - 1;
  tabsOverflow.value = maxScrollLeft > 0;
}

function scrollTabsToStart() {
  const el = tabScroll.value;
  if (!el) return;
  el.scrollTo({ left: 0, behavior: 'smooth' });
}

function scrollTabsToEnd() {
  const el = tabScroll.value;
  if (!el) return;
  el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
}

async function reload() {
  if (!baseId.value) return;
  await work.loadTables(baseId.value);
}

async function createTable() {
  if (!baseId.value) return;
  if (!newTable.value.trim()) return;
  const created = await work.createTable(baseId.value, newTable.value.trim());
  newTable.value = '';
  activeTableId.value = created.id;
  createPopover.value?.hide?.();
}

function setActiveTable(tableId: string) {
  if (!tableId) return;
  activeTableId.value = tableId;
}

function scrollTabIntoView(tableId: string) {
  const el = tabScroll.value;
  if (!el) return;
  const tab = el.querySelector<HTMLElement>(`[data-table-id="${tableId}"]`);
  tab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

function startEditing(table: Table) {
  activeTableId.value = table.id;
  editingTableId.value = table.id;
  editingName.value = table.name;
  editingOriginalName.value = table.name;
  nextTick(() => {
    editingInput.value?.focus();
    editingInput.value?.select();
  });
}

async function commitEditing() {
  if (!editingTableId.value) return;
  if (editingSaving.value) return;
  const name = editingName.value.trim();
  const originalName = editingOriginalName.value.trim();
  if (!name || name === originalName) {
    cancelEditing();
    return;
  }
  const target = work.tables.find((table) => table.id === editingTableId.value);
  if (!target) {
    resetEditing();
    return;
  }

  const currentId = editingTableId.value;
  editingSaving.value = true;
  try {
    target.name = name;
    await work.renameTable(currentId, name);
  } catch (error) {
    target.name = editingOriginalName.value;
    console.error('Failed to rename table', error);
  } finally {
    editingSaving.value = false;
    resetEditing();
    await nextTick();
    updateScrollState();
  }
}

function cancelEditing() {
  if (!editingTableId.value) return;
  if (editingSaving.value) return;
  const target = work.tables.find((table) => table.id === editingTableId.value);
  if (target) {
    target.name = editingOriginalName.value;
  }
  resetEditing();
  nextTick(() => updateScrollState());
}

function resetEditing() {
  editingTableId.value = '';
  editingName.value = '';
  editingOriginalName.value = '';
  editingInput.value = null;
}

const setEditingInputRef: VNodeRef = (el) => {
  editingInput.value = el instanceof HTMLInputElement ? el : null;
};

function openTable(tableId: string) {
  router.push(`/tables/${tableId}`);
}

function toggleCreatePopover(event: MouseEvent) {
  createPopover.value?.toggle(event);
}

function closeCreatePopover() {
  createPopover.value?.hide?.();
}

function toggleAllViewsPopover(event: MouseEvent) {
  allViewsPopover.value?.toggle(event);
}

function selectTableFromList(tableId: string) {
  if (!tableId) return;
  setActiveTable(tableId);
  allViewsPopover.value?.hide?.();
  nextTick(() => scrollTabIntoView(tableId));
}

function openTableMenu(event: MouseEvent, table: Table) {
  activeTableId.value = table.id;
  menuTable.value = table;
  tableMenu.value?.toggle(event);
}
</script>

<style scoped>
.tab-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-scroll::-webkit-scrollbar {
  display: none;
}

.bg-gradient-to-right-f8f9fb {
  box-sizing: content-box;
  background: linear-gradient(90deg, #f5f6f7 58%, rgb(245 246 247 / 0%));
  padding-right: 25px;
}
</style>
