<template>
  <div>
    <div class="overflow-hidden">
      <div class="relative flex items-end gap-2  bg-slate-50/80 pt-1">
        <button
          type="button"
          class="h-full w-10 absolute z-11 bg-gradient-to-right-f8f9fb self-center transition"
          v-show="canScrollLeft"
          aria-label="滚动到开头"
        >
          <i @click="scrollTabsToStart" class="pi pi-caret-left rounded-md hover:bg-slate-200 p-1"></i>
        </button>
        <div ref="tabScroll" class="tab-scroll min-w-0 flex-1 overflow-x-auto" @scroll="updateScrollState">
          <div class="flex items-center whitespace-nowrap" role="tablist" aria-label="表格列表">
            <template v-for="(table, index) in work.tables" :key="table.id">
              <button
                type="button"
                role="tab"
                :aria-selected="table.id === activeTableId"
                class="relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border border-transparent"
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
                    class="h-7 min-w-[9rem] w-40 rounded-md border border-slate-200/80 bg-white px-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    @click.stop
                    @keydown.enter.prevent="commitEditing"
                    @keydown.esc.prevent="cancelEditing"
                    @blur="commitEditing"
                  />
                </template>
                <template v-else>
                  <i
                    class="pi pi-table"
                    :class="table.id === activeTableId ? 'text-green-500' : 'text-slate-400'"
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
              <span class="mx-2 h-4 flex-[0_0_1px] w-px bg-slate-200/80"></span>
            </template>
            <button @click="toggleCreatePopover" class="flex items-center gap-1 rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">
              <i class="pi pi-plus"></i>
              <span>新增</span>
            </button>
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

      <div v-if="activeTable" class="p-4 bg-white">
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

    <Menu ref="tableMenu" :model="tableMenuItems" popup />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkStore, type Table } from '../stores/work';
import TablePage from './TablePage.vue';

const route = useRoute();
const router = useRouter();
const work = useWorkStore();

const baseId = computed(() => (route.params.baseId as string) || '');
const newTable = ref('');
const activeTableId = ref('');
const createPopover = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null);
const tableMenu = ref<{ toggle: (event: Event) => void } | null>(null);
const menuTable = ref<Table | null>(null);
const activeTable = computed(() => work.tables.find((table) => table.id === activeTableId.value) ?? null);
const tabScroll = ref<HTMLDivElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
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
  () => work.tables,
  async () => {
    if (!activeTableId.value || !work.tables.some((table) => table.id === activeTableId.value)) {
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

const tableMenuItems = computed(() => [
  {
    label: '打开表格',
    icon: 'pi pi-external-link',
    command: () => {
      if (menuTable.value) openTable(menuTable.value.id);
    },
  },
  { separator: true },
  { label: '重命名', icon: 'pi pi-pencil', disabled: true },
  { label: '复制表格', icon: 'pi pi-copy', disabled: true },
  { label: '保护表格', icon: 'pi pi-lock', disabled: true },
  { separator: true },
  { label: '删除表格', icon: 'pi pi-trash', disabled: true },
]);

function updateScrollState() {
  const el = tabScroll.value;
  if (!el) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }
  const maxScrollLeft = el.scrollWidth - el.clientWidth;
  canScrollLeft.value = el.scrollLeft > 0;
  canScrollRight.value = el.scrollLeft < maxScrollLeft - 1;
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
}

function resetEditing() {
  editingTableId.value = '';
  editingName.value = '';
  editingOriginalName.value = '';
  editingInput.value = null;
}

function setEditingInputRef(el: HTMLInputElement | null) {
  editingInput.value = el;
}

function openTable(tableId: string) {
  router.push(`/tables/${tableId}`);
}

function toggleCreatePopover(event: MouseEvent) {
  createPopover.value?.toggle(event);
}

function closeCreatePopover() {
  createPopover.value?.hide?.();
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
