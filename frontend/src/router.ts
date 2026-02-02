import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useWorkStore } from './stores/work';
import LoginPage from './views/Login.vue';
import BasePage from './views/Base.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginPage },
    { path: '/workspaces/:workspaceId/bases/:baseId?', component: BasePage },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.path !== '/login' && !auth.token) return '/login';

  const wid = typeof to.params.workspaceId === 'string' ? to.params.workspaceId : '';
  const baseId = typeof to.params.baseId === 'string' ? to.params.baseId : '';
  if (wid && !baseId && /^\/workspaces\/[^/]+\/bases\/?$/.test(to.path)) {
    const work = useWorkStore();
    if (work.currentWorkspaceId !== wid) {
      work.setCurrentWorkspace(wid);
    }
    await work.loadBases(wid);
    const nextBaseId = work.bases[0]?.id ?? '';
    if (!nextBaseId) return '/';
    return {
      path: `/workspaces/${wid}/bases/${nextBaseId}`,
      query: to.query,
    };
  }
});
