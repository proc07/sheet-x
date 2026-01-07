<template>
  <div class="min-h-screen">
    <div v-if="showShell" class="flex min-h-screen">
      <aside
        class="hidden flex-col border-r border-slate-200/70 bg-white/70 py-4 backdrop-blur lg:flex dark:border-slate-800/70 dark:bg-slate-900/70"
        :class="sidebarCollapsed ? 'w-20 px-3' : 'w-64 px-4'"
      >
        <div class="mb-5 flex items-start justify-between gap-2 slide-in">
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
                  <span class="max-w-[150px] truncate">{{ currentWorkspaceLabel }} 工作空间</span>
                  <i class="pi pi-angle-down text-[10px] text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"></i>
                </button>

                <Popover ref="wsPopover">
                  <div class="w-56">
                    <Listbox
                      :modelValue="work.currentWorkspaceId"
                      @update:modelValue="selectWorkspace"
                      :options="work.workspaces"
                      optionLabel="name"
                      optionValue="id"
                      checkmark
                      :highlightOnSelect="false"
                      class="w-full"
                    />
                  </div>

                  <!-- <div
  class="mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg"
  @click.stop
>
  <div class="px-3 py-2 text-[11px] uppercase tracking-wide text-slate-400">Workspaces</div>
  <button
    v-for="ws in "
    :key="ws.id"
    @click="selectWorkspace(ws.id)"
    type="button"
    class="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
  >
    <span class="truncate">{{ ws.name }}</span>
    <i v-if="ws.id === work.currentWorkspaceId" class="pi pi-check text-xs text-slate-500"></i>
  </button>
  <div v-if="work.workspaces.length === 0" class="px-3 py-2 text-sm text-slate-400">
    暂无工作空间
  </div>
</div> -->
              </Popover>
                
              </div>
            </div>
          </div>
          <button
            class="flex align-center rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
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
            class="w-full h-10 pl-10 bg-slate-100/90 border border-slate-200/80 text-slate-700 placeholder:text-slate-400 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <button
          v-else
          class="mb-4 flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100/80 text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
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

        <div v-if="!sidebarCollapsed" class="mt-6 text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">常用</div>
        <div class="mt-2">
          <SidebarNav
            :items="secondaryNav"
            :active-path="route.path"
            :collapsed="sidebarCollapsed"
            :expanded-keys="expandedNav"
            @toggle="toggleNav"
          />
        </div>

        <div class="mt-auto pt-4 text-xs text-slate-400 dark:text-slate-500">
          <div class="flex items-center justify-between" v-if="!sidebarCollapsed">
            <span>新建</span>
            <i class="pi pi-plus"></i>
          </div>
          <div v-else class="flex items-center justify-center">
            <i class="pi pi-plus text-slate-500 dark:text-slate-400"></i>
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
            <button class="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" title="通知">
              <i class="pi pi-bell"></i>
            </button>
            <button class="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" title="设置">
              <i class="pi pi-cog"></i>
            </button>
            <button
              class="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              :title="isDark ? '切换浅色' : '切换深色'"
              @click="toggleDarkMode"
            >
              <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'"></i>
            </button>
            <Button v-if="auth.token" severity="secondary" size="small" label="退出" @click="logout" />
          </div>
        </header>

        <main class="flex-1 min-w-0 overflow-auto px-4 py-4 lg:px-6">
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

const primaryNav: NavItem[] = [
  {
    id: 'tables',
    label: '数据表',
    icon: 'pi pi-table',
    to: '/',
    match: (path: string) => path === '/' || path.startsWith('/workspaces') || path.startsWith('/tables'),
    children: [
      { id: 'tables-customers', label: '客户表', icon: 'pi pi-id-card', to: '/' },
      {
        id: 'tables-sales',
        label: '销售线索',
        icon: 'pi pi-briefcase',
        children: [
          { id: 'tables-sales-q1', label: 'Q1 清单', icon: 'pi pi-calendar' },
          { id: 'tables-sales-q2', label: 'Q2 清单', icon: 'pi pi-calendar' },
        ],
      },
      { id: 'tables-orders', label: '订单表', icon: 'pi pi-list' },
    ],
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
        children: [
          { id: 'dashboard-team-dev', label: '研发', icon: 'pi pi-code' },
          { id: 'dashboard-team-sales', label: '销售', icon: 'pi pi-tags' },
        ],
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
];

const secondaryNav: NavItem[] = [
  { id: 'shortcuts-opps', label: '商机表', icon: 'pi pi-briefcase' },
  { id: 'shortcuts-orders', label: '订单表', icon: 'pi pi-list' },
  { id: 'shortcuts-dashboard', label: '仪表盘 2', icon: 'pi pi-chart-bar' },
];

const pageTitle = computed(() => {
  if (route.path.startsWith('/tables')) return '表格视图';
  if (route.path.startsWith('/workspaces')) return 'Base 管理';
  if (route.path === '/') return '数据表';
  return '工作区';
});

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
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

onMounted(() => {
  const saved = localStorage.getItem('theme');
  if (saved) {
    applyDarkMode(saved === 'dark');
    return;
  }
  applyDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
});

</script>
