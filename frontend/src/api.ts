import axios from 'axios';
import { useAuthStore } from './stores/auth';
import { router } from './router';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore();
      auth.logout();
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

