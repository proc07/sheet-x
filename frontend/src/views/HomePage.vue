<template>
  <div class="grid gap-4 lg:grid-cols-[360px_1fr]">
    <Card class="app-panel">
      <template #title>
        <div class="flex items-center justify-between">
          <span>Workspaces</span>
          <Button size="small" label="刷新" @click="reload" />
        </div>
      </template>

      <template #content>
        <div class="flex gap-2 mb-3">
          <InputText v-model="newWs" placeholder="新建 Workspace 名称" class="flex-1" />
          <Button label="创建" @click="createWs" />
        </div>

        <Listbox
          v-model="activeWorkspaceId"
          :options="work.workspaces"
          optionLabel="name"
          optionValue="id"
          class="w-full"
          @update:modelValue="selectWorkspace"
        />
      </template>
    </Card>

    <Card v-if="activeWorkspaceId" class="app-panel">
      <template #title>
        <div class="flex items-center justify-between">
          <span>Bases</span>
        </div>
      </template>

      <template #content>
        <div class="flex gap-2 mb-3">
          <InputText v-model="newBase" placeholder="新建 Base 名称" class="flex-1" />
          <Button label="创建" @click="createBase" />
        </div>

        <DataTable :value="work.bases" class="w-full" showGridlines>
          <Column field="name" header="Base" />
          <Column header="操作" :style="{ width: '220px' }">
            <template #body="{ data }">
              <Button size="small" label="进入" @click="openBase(data.id)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Message v-else severity="info" :closable="false" class="app-panel px-4 py-3">
      请选择或创建一个 Workspace
    </Message>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useWorkStore } from '../stores/work';
import { useRouter } from 'vue-router';

const work = useWorkStore();
const router = useRouter();

const newWs = ref('');
const newBase = ref('');
const activeWorkspaceId = ref('');

onMounted(async () => {
  await work.loadWorkspaces();
});

async function reload() {
  await work.loadWorkspaces();
}

async function createWs() {
  if (!newWs.value.trim()) return;
  const ws = await work.createWorkspace(newWs.value.trim());
  newWs.value = '';
  activeWorkspaceId.value = ws.id;
  await work.loadBases(ws.id);
}

async function selectWorkspace(id: string) {
  if (!id) return;
  await work.loadBases(id);
}

async function createBase() {
  if (!activeWorkspaceId.value) return;
  if (!newBase.value.trim()) return;
  await work.createBase(activeWorkspaceId.value, newBase.value.trim());
  newBase.value = '';
}

function openBase(baseId: string) {
  router.push(`/workspaces/${activeWorkspaceId.value}/bases/${baseId}`);
}
</script>
