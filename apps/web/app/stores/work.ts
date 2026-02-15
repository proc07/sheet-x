import { defineStore } from 'pinia';
import { api } from '~/services/api';
import type { Workspace, Base, Table, Field, RecordRow } from '../types/table';
export type { Workspace, Base, Table, Field, RecordRow } from '../types/table';

const WORKSPACE_STORAGE_KEY = 'workspace:lastSelectedId';

function loadStoredWorkspaceId() {
  return localStorage.getItem(WORKSPACE_STORAGE_KEY) || '';
}

function persistWorkspaceId(id: string) {
  if (id) {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
    return;
  }
  localStorage.removeItem(WORKSPACE_STORAGE_KEY);
}


export const useWorkStore = defineStore('work', {
  state: () => ({
    workspaces: [] as Workspace[],
    currentWorkspaceId: '' as string,
    basesWorkspaceId: '' as string,
    bases: [] as Base[],
    tables: [] as Table[],
    fields: [] as Field[],
    records: [] as RecordRow[],
    tableAclById: {} as Record<string, any>,
  }),
  actions: {
    async loadWorkspaces() {
      const data = await api<Workspace[]>('/workspaces');
      this.workspaces = data;
      let nextWorkspaceId = this.currentWorkspaceId;
      if (!nextWorkspaceId) {
        const storedWorkspaceId = loadStoredWorkspaceId();
        if (storedWorkspaceId) {
          nextWorkspaceId = storedWorkspaceId;
        }
      }
      if (nextWorkspaceId && !this.workspaces.some(ws => ws.id === nextWorkspaceId)) {
        nextWorkspaceId = '';
      }
      if (!nextWorkspaceId && this.workspaces.length > 0) {
        nextWorkspaceId = this.workspaces[0]!.id;
      }
      if (nextWorkspaceId !== this.currentWorkspaceId) {
        this.setCurrentWorkspace(nextWorkspaceId);
      } else {
        persistWorkspaceId(nextWorkspaceId);
      }
    },
    async createWorkspace(name: string) {
      const data = await api<Workspace>('/workspaces', { method: 'POST', body: { name } });
      await this.loadWorkspaces();
      this.setCurrentWorkspace(data.id);
      return data;
    },
    setCurrentWorkspace(id: string) {
      if (this.currentWorkspaceId === id) {
        persistWorkspaceId(id);
        return;
      }
      this.currentWorkspaceId = id;
      this.basesWorkspaceId = '';
      this.bases = [];
      persistWorkspaceId(id);
    },
    async loadBases(workspaceId: string) {
      this.basesWorkspaceId = workspaceId;
      this.bases = [];
      const data = await api<Base[]>('/bases', { params: { workspaceId } });
      if (this.basesWorkspaceId === workspaceId) {
        this.bases = data;
      }
    },
    async createBase(workspaceId: string, name: string) {
      const data = await api<Base>('/bases', { method: 'POST', body: { workspaceId, name } });
      await this.loadBases(workspaceId);
      return data;
    },
    async loadTables(baseId: string) {
      const data = await api<Table[]>('/tables', { params: { baseId } });
      this.tables = data;
    },
    async createTable(baseId: string, name: string) {
      const data = await api<Table>('/tables', { method: 'POST', body: { baseId, name } });
      await this.loadTables(baseId);
      return data;
    },
    async renameTable(tableId: string, name: string) {
      return this.updateTable(tableId, { name });
    },
    async updateTable(tableId: string, payload: { name?: string; rowHeight?: number }) {
      const data = await api<Table>(`/tables/${tableId}`, { method: 'PATCH', body: payload });
      const idx = this.tables.findIndex(table => table.id === tableId);
      if (idx >= 0) {
        this.tables[idx] = { ...this.tables[idx], ...data };
      }
      return data;
    },
    async loadTable(tableId: string) {
      const data = await api<Table>(`/tables/${tableId}`);
      const idx = this.tables.findIndex(table => table.id === tableId);
      if (idx >= 0) {
        this.tables[idx] = { ...this.tables[idx], ...data };
      } else {
        this.tables.push(data);
      }
      return data;
    },
    async deleteTable(tableId: string) {
      await api(`/tables/${tableId}`, { method: 'DELETE' });
      this.tables = this.tables.filter(table => table.id !== tableId);
    },
    async loadFields(tableId: string) {
      const data = await api<Field[]>('/fields', { params: { tableId } });
      this.fields = data;
    },
    async createField(tableId: string, payload: Partial<Field> & {name: string; type: Field['type']}) {
      const data = await api<Field>('/fields', { method: 'POST', body: { tableId, ...payload } });
      await this.loadFields(tableId);
      return data;
    },
    async updateField(tableId: string, fieldId: string, payload: Partial<Field>) {
      const data = await api<Field>(`/fields/${fieldId}`, { method: 'PATCH', body: payload });
      const idx = this.fields.findIndex(field => field.id === fieldId);
      if (idx >= 0) {
        this.fields[idx] = { ...this.fields[idx], ...data };
      }
      return data;
    },
    async deleteField(tableId: string, fieldId: string) {
      await api(`/fields/${fieldId}`, { method: 'DELETE' });
      this.fields = this.fields.filter(field => field.id !== fieldId);
    },
    async updateFieldLayout(tableId: string, fields: Array<{ id: string; position?: number; width?: number; hidden?: boolean; frozen?: boolean; statType?: string; config?: any }>) {
      if (!tableId || fields.length === 0) return [];
      const data = await api<Field[]>('/fields/layout', { method: 'PATCH', body: { tableId, fields } });

      // update local fields
      if (Array.isArray(data)) {
        data.forEach((updated) => {
          const idx = this.fields.findIndex((field) => field.id === updated.id);
          if (idx >= 0) {
            this.fields[idx] = { ...this.fields[idx], ...updated };
          }
        });
      }
      return data;
    },
    async loadRecords(tableId: string) {
      const data = await api<RecordRow[]>('/records', { params: { tableId } });
      this.records = data;
    },
    async createRecord(tableId: string, initialData: Record<string, any> = {}, position?: number) {
      const data = await api<RecordRow>('/records', { method: 'POST', body: { tableId, data: initialData, position } });
      if (position !== undefined) {
        this.records.splice(position, 0, data);
      } else {
        this.records.push(data);
      }
      return data;
    },
    async patchRecord(recordId: string, revision: number, dataPatch: Record<string, any>) {
      const data = await api<RecordRow>(`/records/${recordId}`, { method: 'PATCH', body: { revision, data: dataPatch } });
      // 局部更新本地
      const idx = this.records.findIndex(r => r.id === recordId);
      if (idx >= 0) this.records[idx] = { ...this.records[idx], ...data };
      return data;
    },
    async deleteRecord(recordId: string) {
      await api(`/records/${recordId}`, { method: 'DELETE' });
      this.records = this.records.filter(r => r.id !== recordId);
    },
    async deleteRecords(recordIds: string[]) {
      await Promise.all(recordIds.map(id => api(`/records/${id}`, { method: 'DELETE' })));
      const idSet = new Set(recordIds);
      this.records = this.records.filter(r => !idSet.has(r.id));
    },
    // ── Stats ──────────────────────────────────────────────────
    async getBatchTableStats(tableId: string, stats: { fieldId: string, type: string }[]) {
      return await api<{ fieldId: string, type: string, value: number | string }[]>(`/tables/${tableId}/stats`, {
        method: 'POST',
        body: { stats }
      });
    },

    // 加载表格权限
    async loadTableAcl(tableId: string) {
      if (!tableId) return null;
      const data = await api(`/advanced-permissions/tables/${tableId}/me`);
      console.log('loadTableAcl', data)
      this.tableAclById[tableId] = data;
      return data;
    },

  },
});
