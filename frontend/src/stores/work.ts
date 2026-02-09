import { defineStore } from 'pinia';
import { api } from '../api';
import type { Workspace, Base, Table, Field, RecordRow } from '../types/table';

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
      const { data } = await api.get('/workspaces');
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
        nextWorkspaceId = this.workspaces[0].id;
      }
      if (nextWorkspaceId !== this.currentWorkspaceId) {
        this.setCurrentWorkspace(nextWorkspaceId);
      } else {
        persistWorkspaceId(nextWorkspaceId);
      }
    },
    async createWorkspace(name: string) {
      const { data } = await api.post('/workspaces', { name });
      await this.loadWorkspaces();
      this.setCurrentWorkspace(data.id);
      return data as Workspace;
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
      const { data } = await api.get('/bases', { params: { workspaceId } });
      if (this.basesWorkspaceId === workspaceId) {
        this.bases = data;
      }
    },
    async createBase(workspaceId: string, name: string) {
      const { data } = await api.post('/bases', { workspaceId, name });
      await this.loadBases(workspaceId);
      return data as Base;
    },
    async loadTables(baseId: string) {
      const { data } = await api.get('/tables', { params: { baseId } });
      this.tables = data;
    },
    async createTable(baseId: string, name: string) {
      const { data } = await api.post('/tables', { baseId, name });
      await this.loadTables(baseId);
      return data as Table;
    },
    async renameTable(tableId: string, name: string) {
      return this.updateTable(tableId, { name });
    },
    async updateTable(tableId: string, payload: { name?: string; rowHeight?: number }) {
      const { data } = await api.patch(`/tables/${tableId}`, payload);
      const idx = this.tables.findIndex(table => table.id === tableId);
      if (idx >= 0) {
        this.tables[idx] = { ...this.tables[idx], ...data };
      }
      return data as Table;
    },
    async loadTable(tableId: string) {
      const { data } = await api.get(`/tables/${tableId}`);
      const idx = this.tables.findIndex(table => table.id === tableId);
      if (idx >= 0) {
        this.tables[idx] = { ...this.tables[idx], ...data };
      } else {
        this.tables.push(data);
      }
      return data as Table;
    },
    async deleteTable(tableId: string) {
      await api.delete(`/tables/${tableId}`);
      this.tables = this.tables.filter(table => table.id !== tableId);
    },
    async loadFields(tableId: string) {
      const { data } = await api.get('/fields', { params: { tableId } });
      this.fields = data;
    },
    async createField(tableId: string, payload: Partial<Field> & {name: string; type: Field['type']}) {
      const { data } = await api.post('/fields', { tableId, ...payload });
      await this.loadFields(tableId);
      return data as Field;
    },
    async updateField(tableId: string, fieldId: string, payload: Partial<Field>) {
      const { data } = await api.patch(`/fields/${fieldId}`, payload);
      const idx = this.fields.findIndex(field => field.id === fieldId);
      if (idx >= 0) {
        this.fields[idx] = { ...this.fields[idx], ...data };
      }
      return data as Field;
    },
    async deleteField(tableId: string, fieldId: string) {
      await api.delete(`/fields/${fieldId}`);
      this.fields = this.fields.filter(field => field.id !== fieldId);
    },
    async updateFieldLayout(tableId: string, fields: Array<{ id: string; position?: number; width?: number; hidden?: boolean; frozen?: boolean; statType?: string; config?: any }>) {
      if (!tableId || fields.length === 0) return [];
      const { data } = await api.patch('/fields/layout', { tableId, fields });

      // update local fields
      if (Array.isArray(data)) {
        data.forEach((updated) => {
          const idx = this.fields.findIndex((field) => field.id === updated.id);
          if (idx >= 0) {
            this.fields[idx] = { ...this.fields[idx], ...updated };
          }
        });
      }
      return data as Field[];
    },
    async loadRecords(tableId: string) {
      const { data } = await api.get('/records', { params: { tableId } });
      this.records = data;
    },
    async createRecord(tableId: string, initialData: Record<string, any> = {}) {
      const { data } = await api.post('/records', { tableId, data: initialData });
      await this.loadRecords(tableId);
      return data as RecordRow;
    },
    async patchRecord(recordId: string, revision: number, dataPatch: Record<string, any>) {
      const { data } = await api.patch(`/records/${recordId}`, { revision, data: dataPatch });
      // 局部更新本地
      const idx = this.records.findIndex(r => r.id === recordId);
      if (idx >= 0) this.records[idx] = { ...this.records[idx], ...data };
      return data as RecordRow;
    },
    async deleteRecord(recordId: string) {
      await api.delete(`/records/${recordId}`);
      this.records = this.records.filter(r => r.id !== recordId);
    },

    // 加载表格权限
    async loadTableAcl(tableId: string) {
      if (!tableId) return null;
      const { data } = await api.get(`/advanced-permissions/tables/${tableId}/me`);
      console.log('loadTableAcl', data)
      this.tableAclById[tableId] = data;
      return data;
    },

  },
});
