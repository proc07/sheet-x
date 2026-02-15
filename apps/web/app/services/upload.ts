import { api } from '~/services/api';

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return await api<{ url: string; name: string; type: string; size: number }>('/storage/upload', {
    method: 'POST',
    body: formData,
  });
}