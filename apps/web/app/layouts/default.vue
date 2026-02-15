<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { api } from '~/services/api'
import type { Base, Table } from '~/types/table'

const route = useRoute()
const toast = useToast()
const workStore = useWorkStore()

const open = ref(false)
const createMenuOpen = ref(false)

// ── Load bases & tables when workspace changes ───────────────
const tablesByBaseId = ref<Record<string, Table[]>>({})

async function loadSidebarData() {
  const wsId = workStore.currentWorkspaceId
  if (!wsId) return

  await workStore.loadBases(wsId)

  const map: Record<string, Table[]> = {}
  await Promise.all(
    workStore.bases.map(async (base) => {
      const tables = await api<Table[]>('/tables', { params: { baseId: base.id } })
      map[base.id] = tables
    })
  )
  tablesByBaseId.value = map
}

watch(() => workStore.currentWorkspaceId, loadSidebarData, { immediate: true })

// ── Create menu actions ──────────────────────────────────────
const createMenuItems = [
  {
    label: '导入 Excel',
    icon: 'i-lucide-file-spreadsheet',
    color: 'green' as const,
    handler: () => toast.add({ title: '导入 Excel 功能即将上线', color: 'info' })
  },
  {
    label: '数据表',
    icon: 'i-lucide-table',
    color: 'blue' as const,
    handler: async () => {
      const firstBase = workStore.bases[0]
      if (!firstBase) {
        toast.add({ title: '请先创建一个 Base', color: 'warning' })
        return
      }
      try {
        const table = await workStore.createTable(firstBase.id, `数据表 ${Date.now().toString(36)}`)
        await loadSidebarData()
        navigateTo(`/table/${table.id}`)
        toast.add({ title: '数据表已创建', color: 'success' })
      } catch {
        toast.add({ title: '创建数据表失败', color: 'error' })
      }
    }
  },
  {
    label: '收集表',
    icon: 'i-lucide-clipboard-list',
    color: 'orange' as const,
    handler: () => toast.add({ title: '收集表功能即将上线', color: 'info' })
  },
  {
    label: '仪表盘',
    icon: 'i-lucide-layout-dashboard',
    color: 'cyan' as const,
    handler: () => toast.add({ title: '仪表盘功能即将上线', color: 'info' })
  },
  {
    label: '工作流',
    icon: 'i-lucide-workflow',
    color: 'purple' as const,
    handler: () => toast.add({ title: '工作流功能即将上线', color: 'info' })
  },
  {
    label: '文档',
    icon: 'i-lucide-file-text',
    color: 'sky' as const,
    handler: () => toast.add({ title: '文档功能即将上线', color: 'info' })
  },
  {
    label: '文件夹',
    icon: 'i-lucide-folder',
    color: 'amber' as const,
    handler: () => toast.add({ title: '文件夹功能即将上线', color: 'info' })
  }
]

function handleCreateItem(item: typeof createMenuItems[number]) {
  createMenuOpen.value = false
  item.handler()
}

// ── Dynamic sidebar links ────────────────────────────────────
const links = computed<NavigationMenuItem[][]>(() => {
  const homeItem: NavigationMenuItem = {
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/',
    onSelect: () => { open.value = false }
  }

  const baseItems: NavigationMenuItem[] = workStore.bases.map(base => {
    const tables = tablesByBaseId.value[base.id] || []
    return {
      label: base.name,
      icon: 'i-lucide-database',
      defaultOpen: true,
      children: tables.map(table => ({
        label: table.name,
        icon: 'i-lucide-table',
        to: `/table/${table.id}`,
        onSelect: () => {
          open.value = false
        }
      }))
    }
  })

  const settingsItem: NavigationMenuItem = {
    label: 'Settings',
    to: '/settings',
    icon: 'i-lucide-settings',
    defaultOpen: true,
    children: [{
      label: 'General',
      to: '/settings',
      exact: true,
      onSelect: () => { open.value = false }
    }, {
      label: 'Members',
      to: '/settings/members',
      onSelect: () => { open.value = false }
    }, {
      label: 'Notifications',
      to: '/settings/notifications',
      onSelect: () => { open.value = false }
    }, {
      label: 'Security',
      to: '/settings/security',
      onSelect: () => { open.value = false }
    }]
  }

  return [
    [homeItem, ...baseItems, settingsItem]
  ]
})

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.value.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <!-- Create menu at bottom -->
        <div class="mt-auto">
          <UPopover v-model:open="createMenuOpen" :content="{ side: 'top', align: 'start' }">
            <UButton
              :label="collapsed ? undefined : '新建'"
              :icon="collapsed ? 'i-lucide-plus' : undefined"
              color="primary"
              variant="ghost"
              block
              :class="collapsed ? 'justify-center' : ''"
            >
              <template v-if="!collapsed" #leading>
                <UIcon name="i-lucide-plus" class="size-4" />
              </template>
              <template v-if="!collapsed" #trailing>
                <UIcon name="i-lucide-chevron-up" class="size-4 ml-auto transition-transform" :class="{ 'rotate-180': createMenuOpen }" />
              </template>
            </UButton>

            <template #content>
              <div class="p-1 min-w-[200px]">
                <button
                  v-for="item in createMenuItems"
                  :key="item.label"
                  class="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm hover:bg-elevated/80 transition-colors text-left cursor-pointer"
                  @click="handleCreateItem(item)"
                >
                  <UIcon :name="item.icon" class="size-5 shrink-0" :class="`text-${item.color}-500`" />
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </template>
          </UPopover>
        </div>
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
