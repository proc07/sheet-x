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

export async function getTableStats(tableId: string, fieldId: string, type: string) {
  const res = await api.get<{ type: string; value: number | string }>(`/tables/${tableId}/stats`, {
    params: { fieldId, type },
  });
  return res.data;
}

export async function getBatchTableStats(tableId: string, stats: { fieldId: string; type: string }[]) {
  const res = await api.post<{ fieldId: string; type: string; value: number | string }[]>(`/tables/${tableId}/stats`, {
    stats,
  });
  return res.data;
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<{ url: string; name: string; type: string; size: number }>('/storage/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}
