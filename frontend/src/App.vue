<template>
  <div class="min-h-screen">
    <div v-if="showShell" class="flex min-h-screen">
      <aside
        class="hidden flex-col border-r border-slate-200/70 bg-white/70 py-4 backdrop-blur lg:flex dark:border-slate-800/70 dark:bg-slate-900/70"
        :class="sidebarCollapsed ? 'w-20 px-3' : 'w-64 px-4'"
      >
        <div class="relative mb-5 flex items-start justify-between gap-2 slide-in">
          <div class="flex items-start gap-3">
            <div class="h-9 w-9 rounded-lg bg-slate-900 dark:bg-amber-50 text-white dark:text-black flex items-center justify-center text-sm font-semibold">
              SX
            </div>
            <div v-if="!sidebarCollapsed" class="min-w-0">
              <div class="text-sm font-semibold dark:text-slate-200">Sheet-X 维表格系统</div>
              <div class="relative">
                <button
                  type="button"
                  class="group mt-1 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  @click="toggleWorkspaceMenu"
                >
                  <span class="max-w-37.5 truncate">{{ currentWorkspaceLabel }} 工作空间</span>
                  <i class="pi pi-angle-down text-[10px] text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"></i>
                </button>

                <Popover ref="wsPopover">
                  <div class="w-48">
                    <div class="flex items-center justify-between pb-2 text-[11px] uppercase tracking-wide text-slate-400">
                      <span>Workspaces</span>
                      <button
                        v-tooltip.top="'添加一个空间'"
                        type="button"
                        class="group relative inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        @click="toggleWorkspaceCreate"
                        >
                        <i class="pi pi-plus text-[10px]"></i>
                      </button>
                    </div>
                    <div v-if="showWorkspaceCreate" class="pb-2">
                      <InputText
                        v-model="newWorkspaceName"
                        placeholder="输入空间名称 (按回车创建)"
                        class="w-full"
                        size="small"
                        @keydown.enter.prevent="submitWorkspaceCreate"
                      />
                    </div>
                    <Listbox
                      :modelValue="work.currentWorkspaceId"
                      @update:modelValue="selectWorkspace"
                      :options="work.workspaces"
                      optionLabel="name"
                      optionValue="id"
                      checkmark
                      class="w-full"
                      emptyMessage="暂无工作空间"
                    />
                  </div>
              </Popover>
              </div>
            </div>
          </div>
          <button
            class="absolute z-[-1] -right-2 top-1/2 -translate-y-1/2 flex align-center rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
            @click="toggleSidebar"
          >
            <i :class="sidebarCollapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'"></i>
          </button>
        </div>

        <div class="mb-4 relative" v-if="!sidebarCollapsed">
          <i class="pi pi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
          <InputText
            v-model="search"
            placeholder="搜索"
            class="w-full pl-9! bg-slate-100/90 border border-slate-200/80 text-slate-700 placeholder:text-slate-400 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <button
          v-else
          class="mb-4 flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100/80 text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
          title="搜索"
        >
          <i class="pi pi-search"></i>
        </button>

        <SidebarNav
          :items="primaryNav"
          :active-path="route.path"
          :collapsed="sidebarCollapsed"
          :expanded-keys="expandedNav"
          @toggle="toggleNav"
        />
        <div v-if="!sidebarCollapsed">
          <div class="mt-6 text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">常用</div>
          <div class="mt-2">
            <SidebarNav
              :items="secondaryNav"
              :active-path="route.path"
              :collapsed="sidebarCollapsed"
              :expanded-keys="expandedNav"
              @toggle="toggleNav"
            />
          </div>
        </div>

        <div class="mt-auto pt-4 text-slate-400 dark:text-slate-500">
          <div
            v-if="!sidebarCollapsed"
            class="border-t border-slate-200/70 pt-3 dark:border-slate-800/70"
          >
            <div class="flex flex-col-reverse gap-3">
              <button
                type="button"
                class="flex w-full items-center justify-between text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
                :aria-expanded="createExpanded"
                @click="toggleCreateMenu"
              >
                <span>新建</span>
                <i :class="!createExpanded ? 'pi pi-angle-up' : 'pi pi-angle-down'"></i>
              </button>
              <Transition name="create-expand">
                <div v-show="createExpanded" class="space-y-1">
                  <button
                    v-for="item in createItems"
                    :key="item.id"
                    type="button"
                    class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                  >
                    <i :class="[item.icon, item.color]" class="text-lg w-5 inline-flex justify-center"></i>
                    <span class="truncate">{{ item.label }}</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
          <div v-else class="flex items-center justify-center">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100/80 text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400"
              title="新建"
            >
              <i class="pi pi-plus"></i>
            </button>
          </div>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur lg:px-6 dark:border-slate-800/70 dark:bg-slate-900/80">
          <div class="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
            <i class="pi pi-sitemap"></i>
            <span>{{ pageTitle }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" title="通知">
              <i class="pi pi-bell"></i>
            </button>
            <button class="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" title="设置">
              <i class="pi pi-cog"></i>
            </button>
            <button
              class="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              :title="isDark ? '切换浅色' : '切换深色'"
              @click="toggleDarkMode"
            >
              <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'"></i>
            </button>
            <Button v-if="auth.token" severity="secondary" size="small" label="退出" @click="logout" />
          </div>
        </header>

        <main class="flex-1 min-w-0 overflow-auto">
          <div class="fade-in">
            <router-view />
          </div>
        </main>
      </div>
    </div>

    <div v-else class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-md fade-in">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from './stores/auth';
import { useRoute, useRouter } from 'vue-router';
import SidebarNav from './components/SidebarNav.vue';
import { useWorkStore } from './stores/work';

const auth = useAuthStore();
const work = useWorkStore();
const router = useRouter();
const route = useRoute();
const search = ref('');
const sidebarCollapsed = ref(false);
const expandedNav = ref(new Set<string>(['tables']));
const wsPopover = ref<{ toggle: (event: MouseEvent) => void } | null>(null);
const isDark = ref(false);

const showShell = computed(() => route.path !== '/login');
const currentWorkspaceLabel = computed(() => {
  const current = work.workspaces.find((ws) => ws.id === work.currentWorkspaceId);
  return current?.name ?? 'Workspace';
});

type NavItem = {
  id: string;
  label: string;
  icon: string;
  to?: string;
  match?: (path: string) => boolean;
  children?: NavItem[];
};

const baseNavItems = computed<NavItem[]>(() => {
  const workspaceId = work.currentWorkspaceId;
  if (!workspaceId || work.basesWorkspaceId !== workspaceId) return [];
  return work.bases.map((base) => ({
    id: `base-${base.id}`,
    label: base.name,
    icon: 'pi pi-table',
    to: `/workspaces/${workspaceId}/bases/${base.id}`,
    match: (path: string) => path.startsWith(`/workspaces/${workspaceId}/bases/${base.id}`),
  }));
});

const primaryNav = computed<NavItem[]>(() => [
  {
    id: 'tables',
    label: '数据表',
    icon: 'pi pi-database',
    match: (path: string) => path === '/' || path.startsWith('/workspaces') || path.startsWith('/tables'),
    children: baseNavItems.value
  },
  {
    id: 'dashboard',
    label: '仪表盘',
    icon: 'pi pi-chart-line',
    children: [
      { id: 'dashboard-overview', label: '增长面板', icon: 'pi pi-chart-bar' },
      {
        id: 'dashboard-team',
        label: '团队看板',
        icon: 'pi pi-th-large',
      },
    ],
  },
  {
    id: 'workflow',
    label: '工作流',
    icon: 'pi pi-share-alt',
    children: [
      { id: 'workflow-auto', label: '自动化', icon: 'pi pi-bolt' },
      { id: 'workflow-approval', label: '审批', icon: 'pi pi-check-square' },
    ],
  },
]);

const secondaryNav: NavItem[] = [
  { id: 'shortcuts-opps', label: '商机表', icon: 'pi pi-briefcase' },
  { id: 'shortcuts-orders', label: '订单表', icon: 'pi pi-list' },
  { id: 'shortcuts-dashboard', label: '仪表盘 2', icon: 'pi pi-chart-bar' },
];
const createExpanded = ref(false);
const createItems = [
  { id: 'create-import-excel', label: '导入 Excel', icon: 'pi pi-file-excel', color: 'text-emerald-600' },
  { id: 'create-table', label: '数据表', icon: 'pi pi-table', color: 'text-violet-500' },
  { id: 'create-form', label: '收集表', icon: 'pi pi-inbox', color: 'text-orange-500' },
  { id: 'create-dashboard', label: '仪表盘', icon: 'pi pi-chart-pie', color: 'text-blue-500' },
  { id: 'create-workflow', label: '工作流', icon: 'pi pi-share-alt', color: 'text-purple-500' },
  { id: 'create-doc', label: '文档', icon: 'pi pi-file', color: 'text-sky-500' },
  { id: 'create-folder', label: '文件夹', icon: 'pi pi-folder', color: 'text-indigo-500' },
];

const pageTitle = computed(() => {
  if (route.path.startsWith('/tables')) return '表格视图';
  if (route.path.startsWith('/workspaces')) return 'Base 管理';
  if (route.path === '/') return '数据表';
  return '工作区';
});

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  if (sidebarCollapsed.value) {
    createExpanded.value = false;
  }
}

function toggleWorkspaceMenu(event: MouseEvent) {
  wsPopover.value?.toggle(event);
}

function selectWorkspace(id: string) {
  work.setCurrentWorkspace(id);
}

function toggleNav(id: string) {
  const next = new Set(expandedNav.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedNav.value = next;
}

function logout() {
  auth.logout();
  router.push('/login');
}

function applyDarkMode(value: boolean) {
  isDark.value = value;
  document.documentElement.classList.toggle('dark', value);
  localStorage.setItem('theme', value ? 'dark' : 'light');
}

function toggleDarkMode() {
  applyDarkMode(!isDark.value);
}

function toggleCreateMenu() {
  createExpanded.value = !createExpanded.value;
}

watch(
  () => auth.token,
  async (token) => {
    if (!token) return;
    if (work.workspaces.length === 0) {
      await work.loadWorkspaces();
    }
  },
  { immediate: true }
);

watch(
  () => sidebarCollapsed.value,
  (collapsed) => {
    if (collapsed) {
      createExpanded.value = false;
    }
  }
);

watch(
  () => work.currentWorkspaceId,
  async (workspaceId) => {
    if (!auth.token || !workspaceId) return;

    await work.loadBases(workspaceId);
    const nextBaseId = work.bases[0]?.id;
    const targetPath = nextBaseId
      ? `/workspaces/${workspaceId}/bases/${nextBaseId}`
      : `/workspaces/${workspaceId}/bases`;
    if (router.currentRoute.value.path !== targetPath) {
      router.replace(targetPath);
    }
  },
  { immediate: true }
);

onMounted(() => {
  const saved = localStorage.getItem('theme');
  if (saved) {
    applyDarkMode(saved === 'dark');
    return;
  }
  applyDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
});

// workspace creation
const showWorkspaceCreate = ref(false);
const newWorkspaceName = ref('');
const creatingWorkspace = ref(false);

function toggleWorkspaceCreate() {
  showWorkspaceCreate.value = !showWorkspaceCreate.value;
  if (!showWorkspaceCreate.value) {
    newWorkspaceName.value = '';
  }
}

async function submitWorkspaceCreate() {
  const name = newWorkspaceName.value.trim();
  if (!name || creatingWorkspace.value) return;

  creatingWorkspace.value = true;

  try {
    await work.createWorkspace(name);
    newWorkspaceName.value = '';
    showWorkspaceCreate.value = false;
  } finally {
    creatingWorkspace.value = false;
  }
}

</script>

<style scoped>
.create-expand-enter-active,
.create-expand-leave-active {
  overflow: hidden;
  transition: max-height 220ms ease, opacity 220ms ease, transform 220ms ease;
}

.create-expand-enter-from,
.create-expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(6px);
}

.create-expand-enter-to,
.create-expand-leave-from {
  max-height: 480px;
  opacity: 1;
  transform: translateY(0);
}
</style>
