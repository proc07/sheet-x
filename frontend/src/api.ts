import axios from 'axios';
import { useAuthStore } from './stores/auth';

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
