import { defineStore } from 'pinia';
import { api } from '../api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
  }),
  actions: {
    async signup(email: string, password: string, name?: string) {
      const { data } = await api.post('/auth/signup', { email, password, name });
      this.token = data.access_token;
      localStorage.setItem('token', this.token);
    },
    async login(email: string, password: string) {
      const { data } = await api.post('/auth/login', { email, password });
      this.token = data.access_token;
      localStorage.setItem('token', this.token);
    },
    logout() {
      this.token = '';
      localStorage.removeItem('token');
    },
  },
});
