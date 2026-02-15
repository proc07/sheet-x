import { defineStore } from 'pinia';
import { api } from '~/services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
  }),
  actions: {
    async signup(email: string, password: string, name?: string) {
      const data = await api<{ access_token: string }>('/auth/signup', { method: 'POST', body: { email, password, name } });
      this.token = data.access_token;
      localStorage.setItem('token', this.token);
    },
    async login(email: string, password: string) {
      const data = await api<{ access_token: string }>('/auth/login', { method: 'POST', body: { email, password } });
      this.token = data.access_token;
      localStorage.setItem('token', this.token);
    },
    logout() {
      this.token = '';
      localStorage.removeItem('token');
    },
  },
});
