<template>
  <div class="h-full flex items-center justify-center px-6">
    <div class="max-w-lg w-full text-center">
      <div class="text-lg font-semibold text-slate-700">数据表</div>
      <div class="mt-2 text-sm text-slate-500">从左侧选择或创建一个 Workspace，并进入对应的 Base。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useWorkStore } from '../stores/work';
import { useRouter } from 'vue-router';

const work = useWorkStore();
const router = useRouter();

async function ensureReady() {
  if (work.workspaces.length === 0) {
    await work.loadWorkspaces();
  }
}

watch(
  () => work.currentWorkspaceId,
  async (wid) => {
    if (!wid) return;
    await work.loadBases(wid);
    const baseId = work.bases[0]?.id;
    if (!baseId) return;
    await router.replace(`/workspaces/${wid}/bases/${baseId}`);
  },
  { immediate: true }
);

onMounted(ensureReady);
</script>

