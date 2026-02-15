import { useAuthStore } from '~/stores/auth';

export const api = $fetch.create({
  baseURL: 'http://localhost:3000',
  onRequest({ options }) {
    const auth = useAuthStore();
    if (auth.token) {
      options.headers.set('Authorization', `Bearer ${auth.token}`);
    }
  },
  onResponseError({ response }) {
    if (response.status === 401) {
      const auth = useAuthStore();
      auth.logout();
      navigateTo('/login');
    }
  },
});
