import { api } from '../api';

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