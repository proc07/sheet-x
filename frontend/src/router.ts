import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';
import LoginPage from './views/LoginPage.vue';
import HomePage from './views/HomePage.vue';
import BasePage from './views/BasePage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginPage },
    { path: '/', component: HomePage },
    { path: '/workspaces/:workspaceId/bases/:baseId?', component: BasePage },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.path !== '/login' && !auth.token) return '/login';
});
