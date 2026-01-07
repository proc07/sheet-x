import { defineStore } from 'pinia';
import { api } from '../api';

export type Workspace = { id: string; name: string; createdAt: string };
export type Base = { id: string; name: string; createdAt: string };
export type Table = { id: string; name: string; createdAt: string };
export type Field = {
  id: string;
  name: string;
  type: 'TEXT'|'NUMBER'|'DATE'|'SINGLE_SELECT'|'MULTI_SELECT'|'USER'|'ATTACHMENT';
  required: boolean;
  options?: any;
  position: number;
};
export type RecordRow = { id: string; data: Record<string, any>; revision: number };

export const useWorkStore = defineStore('work', {
  state: () => ({
    workspaces: [] as Workspace[],
    currentWorkspaceId: '' as string,
    bases: [] as Base[],
    tables: [] as Table[],
    fields: [] as Field[],
    records: [] as RecordRow[],
  }),
  actions: {
    async loadWorkspaces() {
      const { data } = await api.get('/workspaces');
      this.workspaces = data;
      if (!this.currentWorkspaceId && this.workspaces.length > 0) {
        this.currentWorkspaceId = this.workspaces[0].id;
      }
      if (this.currentWorkspaceId && !this.workspaces.some(ws => ws.id === this.currentWorkspaceId)) {
        this.currentWorkspaceId = this.workspaces[0]?.id ?? '';
      }
    },
    async createWorkspace(name: string) {
      const { data } = await api.post('/workspaces', { name });
      await this.loadWorkspaces();
      this.currentWorkspaceId = data.id;
      return data as Workspace;
    },
    setCurrentWorkspace(id: string) {
      this.currentWorkspaceId = id;
    },
    async loadBases(workspaceId: string) {
      const { data } = await api.get('/bases', { params: { workspaceId } });
      this.bases = data;
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
    async loadFields(tableId: string) {
      const { data } = await api.get('/fields', { params: { tableId } });
      this.fields = data;
    },
    async createField(tableId: string, payload: Partial<Field> & {name: string; type: Field['type']}) {
      const { data } = await api.post('/fields', { tableId, ...payload });
      await this.loadFields(tableId);
      return data as Field;
    },
    async loadRecords(tableId: string) {
      const { data } = await api.get('/records', { params: { tableId } });
      this.records = data;
    },
    async createRecord(tableId: string) {
      const { data } = await api.post('/records', { tableId, data: {} });
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
  },
});
