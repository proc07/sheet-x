import { api } from '../api';

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