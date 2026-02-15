import { api } from '~/services/api';

export async function loadBaseAdvancedPermissions(baseId: string) {
  return await api(`/advanced-permissions/bases/${baseId}`);
}

export async function saveBaseAdvancedPermissions(baseId: string, payload: { enabled?: boolean; allowShareGrant?: boolean; config?: any }) {
  return await api(`/advanced-permissions/bases/${baseId}`, { method: 'PUT', body: payload });
}

export async function listWorkspaceMembers(workspaceId: string) {
  return await api(`/workspaces/${workspaceId}/members`);
}

export async function addWorkspaceMember(workspaceId: string, payload: { email: string; role?: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' }) {
  return await api(`/workspaces/${workspaceId}/members`, { method: 'POST', body: payload });
}