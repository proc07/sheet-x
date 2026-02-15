import { api } from '~/services/api';

export async function getTableStats(tableId: string, fieldId: string, type: string) {
  return await api<{ type: string; value: number | string }>(`/tables/${tableId}/stats`, {
    params: { fieldId, type },
  });
}

export async function getBatchTableStats(tableId: string, stats: { fieldId: string; type: string }[]) {
  return await api<{ fieldId: string; type: string; value: number | string }[]>(`/tables/${tableId}/stats`, {
    method: 'POST',
    body: { stats },
  });
}