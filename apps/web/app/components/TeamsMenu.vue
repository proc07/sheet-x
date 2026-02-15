<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useWorkStore } from '~/stores/work';

defineProps<{
  collapsed?: boolean
}>()

const workStore = useWorkStore()
const toast = useToast()

// ── Load workspaces on mount ──────────────────────────────────
onMounted(() => {
  if (workStore.workspaces.length === 0) {
    workStore.loadWorkspaces()
  }
})

// ── Teams derived from workspaces ─────────────────────────────
const teams = computed(() =>
  workStore.workspaces.map(ws => ({
    id: ws.id,
    label: ws.name,
    avatar: {
      icon: 'i-lucide-building-2',
      alt: ws.name
    }
  }))
)

const selectedTeam = computed(() =>
  teams.value.find(t => t.id === workStore.currentWorkspaceId) ?? teams.value[0]
)

// ── Create Team Modal ─────────────────────────────────────────
const createModalOpen = ref(false)
const newTeamName = ref('')
const creating = ref(false)

async function handleCreateTeam() {
  const name = newTeamName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await workStore.createWorkspace(name)
    toast.add({ title: `工作空间「${name}」已创建`, color: 'success' })
    createModalOpen.value = false
    newTeamName.value = ''
  } catch (e: any) {
    toast.add({ title: '创建失败', description: e?.message, color: 'error' })
  } finally {
    creating.value = false
  }
}

// ── Manage Teams Modal ────────────────────────────────────────
const manageModalOpen = ref(false)
const renamingId = ref('')
const renamingName = ref('')

function startRename(ws: { id: string; label: string }) {
  renamingId.value = ws.id
  renamingName.value = ws.label
}

function cancelRename() {
  renamingId.value = ''
  renamingName.value = ''
}

// ── Dropdown items ────────────────────────────────────────────
const items = computed<DropdownMenuItem[][]>(() => {
  return [
    teams.value.map(team => ({
      ...team,
      onSelect() {
        workStore.setCurrentWorkspace(team.id)
      }
    })),
    [{
      label: 'Create team',
      icon: 'i-lucide-circle-plus',
      onSelect() {
        createModalOpen.value = true
      }
    }, {
      label: 'Manage teams',
      icon: 'i-lucide-cog',
      onSelect() {
        manageModalOpen.value = true
      }
    }]
  ]
})
</script>

<template>
  <!-- Dropdown Menu -->
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...selectedTeam,
        label: collapsed ? undefined : selectedTeam?.label,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />
  </UDropdownMenu>

  <!-- Create Team Modal -->
  <UModal v-model:open="createModalOpen">
    <template #content>
      <div class="p-6 flex flex-col gap-4">
        <h3 class="text-lg font-semibold text-highlighted">创建工作空间</h3>

        <UFormField label="名称">
          <UInput
            v-model="newTeamName"
            placeholder="请输入工作空间名称"
            autofocus
            @keydown.enter="handleCreateTeam"
          />
        </UFormField>

        <div class="flex justify-end gap-2 mt-2">
          <UButton
            label="取消"
            color="neutral"
            variant="ghost"
            @click="createModalOpen = false"
          />
          <UButton
            label="创建"
            :loading="creating"
            :disabled="!newTeamName.trim()"
            @click="handleCreateTeam"
          />
        </div>
      </div>
    </template>
  </UModal>

  <!-- Manage Teams Modal -->
  <UModal v-model:open="manageModalOpen" :ui="{ content: 'sm:max-w-lg' }">
    <template #content>
      <div class="p-6 flex flex-col gap-4">
        <h3 class="text-lg font-semibold text-highlighted">管理工作空间</h3>

        <div v-if="teams.length === 0" class="text-sm text-muted py-4 text-center">
          暂无工作空间
        </div>

        <div class="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          <div
            v-for="ws in teams"
            :key="ws.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-default hover:bg-elevated/50 transition-colors"
          >
            <UAvatar :icon="'i-lucide-building-2'" :alt="ws.label" size="sm" />

            <!-- Rename mode -->
            <template v-if="renamingId === ws.id">
              <UInput
                v-model="renamingName"
                size="sm"
                class="flex-1"
                autofocus
                @keydown.enter="cancelRename"
                @keydown.escape="cancelRename"
              />
              <UButton
                size="xs"
                icon="i-lucide-check"
                color="success"
                variant="ghost"
                @click="cancelRename"
              />
              <UButton
                size="xs"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                @click="cancelRename"
              />
            </template>

            <!-- Display mode -->
            <template v-else>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-highlighted truncate">{{ ws.label }}</div>
              </div>

              <UBadge
                v-if="ws.id === workStore.currentWorkspaceId"
                label="当前"
                size="sm"
                color="primary"
                variant="subtle"
              />

              <UButton
                v-if="ws.id !== workStore.currentWorkspaceId"
                size="xs"
                label="切换"
                variant="outline"
                color="neutral"
                @click="workStore.setCurrentWorkspace(ws.id)"
              />

              <UButton
                size="xs"
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                @click="startRename(ws)"
              />
            </template>
          </div>
        </div>

        <div class="flex justify-end mt-2">
          <UButton label="关闭" color="neutral" variant="ghost" @click="manageModalOpen = false" />
        </div>
      </div>
    </template>
  </UModal>
</template>
