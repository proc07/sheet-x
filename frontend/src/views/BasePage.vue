<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <Button label="返回" @click="router.push('/')" />
        <h2 class="m-0">Tables</h2>
      </div>
      <div class="flex gap-2">
        <InputText v-model="newTable" placeholder="新建 Table 名称" class="w-56" />
        <Button label="创建" @click="createTable" />
      </div>
    </div>

    <div class="app-panel p-2">
      <DataTable :value="work.tables" class="w-full" showGridlines>
        <Column field="name" header="Table" />
        <Column header="操作" :style="{ width: '260px' }">
          <template #body="{ data }">
            <Button size="small" label="打开" @click="openTable(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkStore } from '../stores/work';

const route = useRoute();
const router = useRouter();
const work = useWorkStore();

const baseId = route.params.baseId as string;
const newTable = ref('');

onMounted(async () => {
  await work.loadTables(baseId);
});

async function createTable() {
  if (!newTable.value.trim()) return;
  await work.createTable(baseId, newTable.value.trim());
  newTable.value = '';
}

function openTable(tableId: string) {
  router.push(`/tables/${tableId}`);
}
</script>
