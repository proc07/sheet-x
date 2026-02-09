import { api } from '../api';

export async function  loadBaseAdvancedPermissions(baseId: string) {
  const { data } = await api.get(`/advanced-permissions/bases/${baseId}`);
  return data;
}

export  async function  saveBaseAdvancedPermissions(baseId: string, payload: { enabled?: boolean; allowShareGrant?: boolean; config?: any }) {
  const { data } = await api.put(`/advanced-permissions/bases/${baseId}`, payload);
  return data;
}

export async function listWorkspaceMembers(workspaceId: string) {
  const { data } = await api.get(`/workspaces/${workspaceId}/members`);
  return data;
}

export async function addWorkspaceMember(workspaceId: string, payload: { email: string; role?: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' }) {
  const { data } = await api.post(`/workspaces/${workspaceId}/members`, payload);
  return data;
}