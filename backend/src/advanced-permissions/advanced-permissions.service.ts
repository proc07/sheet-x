import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { BaseAdvancedPermissionConfig, EffectiveTablePermission, PermissionLevel, TablePerm } from './advanced-permissions.types';
import { defaultAdminSystemRole, defaultBaseAdvancedPermissionConfig, defaultOwnerSystemRole, getTablePermissionConfig, normalizeConfig, pickRoleForUser, workspaceRoleToSystemRoleKey } from './advanced-permissions.defaults';
import { matchesScope } from './advanced-permissions.evaluator';
import { AuditService } from '../audit/audit.service';

type CacheEntry<T> = { expiresAt: number; value: T };

@Injectable()
export class AdvancedPermissionsService {
  // 缓存：表级权限，key 为 `tableAcl:${baseId}:${tableId}:${userId}}`；
  private cache = new Map<string, CacheEntry<EffectiveTablePermission>>();
  // 缓存最大数量，5000 个
  private cacheMax = 5000;
  // 缓存过期时间，30 秒
  private cacheTtlMs = 30_000;

  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  private cacheGet(key: string) {
    const hit = this.cache.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return hit.value;
  }

  private cacheSet(key: string, value: EffectiveTablePermission) {
    if (this.cache.size >= this.cacheMax) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
  }

  private cacheInvalidateByBase(baseId: string) {
    const prefix = `tableAcl:${baseId}:`;
    for (const k of this.cache.keys()) {
      if (k.startsWith(prefix)) this.cache.delete(k);
    }
  }

  private permissionRank(level: PermissionLevel) {
    const rank: Record<PermissionLevel, number> = { NONE: 0, READ: 1, EDIT: 2, MANAGE: 3 };
    return rank[level];
  }

  private requireAtLeast(actual: PermissionLevel, required: PermissionLevel) {
    if (this.permissionRank(actual) < this.permissionRank(required)) {
      throw new ForbiddenException('No permission');
    }
  }

  // 高级权限配置：把前端/DB 传来的 config 先 标准化 再校验 ，保证写入数据库的一定是“结构完整 + 不违规 + 系统角色不可篡改”的配置。
  private normalizeAndValidateConfig(raw: any): BaseAdvancedPermissionConfig {
    const cfg = normalizeConfig(raw);
    const byId = new Set<string>();

    // 校验角色 ID、名称、成员用户 ID、表级权限、仪表盘权限、自动化权限、其他权限 合法性
    for (const r of cfg.roles) {
      if (!r?.id || typeof r.id !== 'string') throw new BadRequestException('Invalid role id');
      if (byId.has(r.id)) throw new BadRequestException('Duplicate role id');
      byId.add(r.id);

      if (!r.name || typeof r.name !== 'string') throw new BadRequestException('Invalid role name');
      if (!Array.isArray(r.memberUserIds)) r.memberUserIds = [];
      if (!r.tables || typeof r.tables !== 'object') r.tables = { '*': (r.tables)?.['*'] ?? undefined };
      if (!r.dashboard) r.dashboard = { permission: 'READ' };
      if (!r.automation) r.automation = { permission: 'NONE' };
      if (!r.other) r.other = { allowCopy: true, allowDuplicate: true, allowDownload: true, allowPrint: true };
    }

    // 强制要求系统角色存在（否则直接 400）
    const ensureSystem = (key: 'owner' | 'admin' | 'editor' | 'viewer') => {
      const role = cfg.roles.find((r) => r.type === 'system' && r.key === key);
      if (!role) throw new BadRequestException(`Missing system role: ${key}`);
      // 系统角色（owner/admin/editor/viewer）的成员由工作空间角色自动决定，不允许手动维护，因此强制清空
      role.memberUserIds = [];

      return role;
    };
    ensureSystem('owner');
    ensureSystem('admin');
    ensureSystem('editor');
    ensureSystem('viewer');

    const lockSystem = (key: 'owner' | 'admin') => {
      const locked = key === 'owner' ? defaultOwnerSystemRole() : defaultAdminSystemRole();
      const idx = cfg.roles.findIndex((r) => r.type === 'system' && r.key === key);
      cfg.roles[idx] = locked;
    };
    lockSystem('owner');
    lockSystem('admin');

    for (const role of cfg.roles) {
      for (const [tableId, perm] of Object.entries(role.tables ?? {})) {
        if (!perm) continue;
        if (!perm.tablePermission) throw new BadRequestException('Invalid table permission');
        if (!perm.record) throw new BadRequestException('Invalid record permission');
        if (!perm.fields) throw new BadRequestException('Invalid field permission');
        if (!perm.views) throw new BadRequestException('Invalid view permission');

        const tp = perm.tablePermission;
        if (tp === 'MANAGE') continue;

        if (tp === 'READ' || tp === 'NONE') {
          if (perm.record.canCreate || perm.record.canDelete) throw new BadRequestException('Invalid record operation for read-only table');
          if (perm.views.canManage) throw new BadRequestException('Invalid view manage for read-only table');
          if (perm.fields.mode === 'CUSTOM') {
            for (const p of Object.values(perm.fields.permsByFieldId ?? {})) {
              if (p?.canCreate || p?.canEdit) throw new BadRequestException('Invalid field edit for read-only table');
            }
          }
        }

        if (perm.views.visible?.mode === 'SPECIFIC' && perm.views.canManage) {
          throw new BadRequestException('Invalid view config');
        }

        if (!perm.views.visible) perm.views.visible = { mode: 'ALL', viewIds: [] };
        if (!Array.isArray(perm.views.visible.viewIds)) perm.views.visible.viewIds = [];

        if (!perm.record.editScope) perm.record.editScope = { type: 'ALL' };
        if (!perm.record.readScope) perm.record.readScope = { type: 'ALL' };
      }
    }

    return cfg;
  }

  async assertBaseManageable(userId: string, baseId: string) {
    const base = await this.prisma.base.findUnique({
      where: { id: baseId },
      select: { workspaceId: true },
    });
    if (!base) throw new NotFoundException('Base not found');

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: base.workspaceId, userId } },
      select: { role: true },
    });
    if (!member) throw new ForbiddenException('Not a member');
    // 校验用户是否是 base 管理员或所有者
    if (member.role !== 'OWNER' && member.role !== 'ADMIN') throw new ForbiddenException('No manage permission');
    return { workspaceId: base.workspaceId };
  }

  async assertTableReadable(userId: string, tableId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, baseId: true, base: { select: { workspaceId: true } } },
    });
    if (!table) throw new NotFoundException('Table not found');
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: table.base.workspaceId, userId } },
      select: { role: true },
    });
    if (!member) throw new ForbiddenException('Not a member');
    return { baseId: table.baseId, workspaceId: table.base.workspaceId, workspaceRole: member.role };
  }

  async getOrCreateBaseRow(baseId: string) {
    const row = await this.prisma.baseAdvancedPermission.findUnique({
      where: { baseId },
      select: { id: true, baseId: true, enabled: true, allowShareGrant: true, config: true, updatedAt: true },
    });
    if (row) return row;
    return this.prisma.baseAdvancedPermission.create({
      data: { baseId, enabled: false, allowShareGrant: true, config: defaultBaseAdvancedPermissionConfig() },
      select: { id: true, baseId: true, enabled: true, allowShareGrant: true, config: true, updatedAt: true },
    });
  }

  async getBaseConfigForManage(userId: string, baseId: string) {
    const { workspaceId } = await this.assertBaseManageable(userId, baseId);
    const row = await this.getOrCreateBaseRow(baseId);
    const config = normalizeConfig(row.config);

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: { id: true, userId: true, role: true, user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const tables = await this.prisma.table.findMany({
      where: { baseId },
      select: {
        id: true,
        name: true,
        fields: { select: { id: true, name: true, type: true }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
        views: { select: { id: true, name: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { enabled: row.enabled, allowShareGrant: row.allowShareGrant, config, members, tables, updatedAt: row.updatedAt };
  }

  async updateBaseConfig(userId: string, baseId: string, payload: { enabled?: boolean; allowShareGrant?: boolean; config?: any }) {
    await this.assertBaseManageable(userId, baseId);
    const current = await this.getOrCreateBaseRow(baseId);
    const nextConfig = payload.config ? this.normalizeAndValidateConfig(payload.config) : undefined;

    const updated = await this.prisma.baseAdvancedPermission.upsert({
      where: { baseId },
      create: {
        baseId,
        enabled: payload.enabled ?? false,
        allowShareGrant: payload.allowShareGrant ?? true,
        config: (nextConfig ?? defaultBaseAdvancedPermissionConfig()),
      },
      update: {
        enabled: payload.enabled ?? undefined,
        allowShareGrant: payload.allowShareGrant ?? undefined,
        config: (nextConfig ?? undefined),
      },
      select: { baseId: true, enabled: true, allowShareGrant: true, config: true, updatedAt: true },
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'ADVANCED_PERMISSION_UPDATE',
      entityType: 'BaseAdvancedPermission',
      entityId: updated.baseId,
      baseId,
      data: { before: current, after: updated, payload },
    });

    this.cacheInvalidateByBase(baseId);
    return updated;
  }

  private fallbackTablePermission(workspaceRole: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'): PermissionLevel {
    if (workspaceRole === 'OWNER' || workspaceRole === 'ADMIN') return 'MANAGE';
    if (workspaceRole === 'VIEWER') return 'READ';
    return 'EDIT';
  }

  // 获取指定 table 的我的权限数据
  async getEffectiveTablePermission(userId: string, tableId: string): Promise<EffectiveTablePermission> {
    const { baseId, workspaceRole } = await this.assertTableReadable(userId, tableId);
    const row = await this.getOrCreateBaseRow(baseId);
    const enabled = !!row.enabled;
    const cfg = normalizeConfig(row.config);

    const cacheKey = `tableAcl:${baseId}:${tableId}:${userId}:${row.updatedAt.getTime()}:${enabled ? 1 : 0}`;
    const cached = this.cacheGet(cacheKey);
    if (cached) return cached;

    // 高级权限未开启时，根据工作空间角色返回默认权限
    if (!enabled) {
      const tablePermission = this.fallbackTablePermission(workspaceRole);
      const key = workspaceRoleToSystemRoleKey(workspaceRole);
      const result: EffectiveTablePermission = {
        enabled: false,
        role: { id: `workspace_${workspaceRole}`, type: 'system', key, name: workspaceRole },
        tablePermission,
        record: {
          canCreate: workspaceRole !== 'VIEWER',
          canDelete: workspaceRole !== 'VIEWER',
          editScope: { type: 'ALL' },
          readScope: { type: 'ALL' },
        },
        fields: { mode: 'ALL', permsByFieldId: {} },
        views: { canManage: workspaceRole !== 'VIEWER', visible: { mode: 'ALL', viewIds: [] } },
        dashboard: { permission: workspaceRole === 'OWNER' || workspaceRole === 'ADMIN' ? 'EDIT' : 'READ' },
        automation: { permission: workspaceRole === 'OWNER' || workspaceRole === 'ADMIN' ? 'MANAGE' : 'NONE' },
        other: { allowCopy: true, allowDuplicate: true, allowDownload: true, allowPrint: true },
      };
      this.cacheSet(cacheKey, result);
      return result;
    }

    const role = pickRoleForUser(cfg, workspaceRole, userId);
    const tablePerm = getTablePermissionConfig(role, tableId);

    const result: EffectiveTablePermission = {
      enabled: true,
      role: { id: role.id, type: role.type, key: role.key, name: role.name },
      tablePermission: tablePerm.tablePermission,
      record: tablePerm.record,
      fields: tablePerm.fields,
      views: tablePerm.views,
      dashboard: role.dashboard,
      automation: role.automation,
      other: role.other,
    };

    this.cacheSet(cacheKey, result);
    return result;
  }

  filterFields(tablePerm: EffectiveTablePermission, fields: Array<{ id: string }>) {
    if (tablePerm.tablePermission === 'NONE') return [];
    if (tablePerm.fields.mode !== 'CUSTOM') return fields;
    const perms = tablePerm.fields.permsByFieldId ?? {};
    return fields.filter((f) => perms[f.id]?.canRead !== false);
  }

  filterRecordData(tablePerm: EffectiveTablePermission, recordData: any, fields: Array<{ id: string }>) {
    if (!recordData || typeof recordData !== 'object') return recordData;
    if (tablePerm.fields.mode !== 'CUSTOM') return recordData;

    const allowed = new Set(this.filterFields(tablePerm, fields).map((f) => f.id));
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(recordData)) {
      if (allowed.has(k)) out[k] = v;
    }
    return out;
  }

  filterRecordsByScope(tablePerm: EffectiveTablePermission, records: Array<{ createdByUserId?: string | null; data: any }>, userId: string) {
    if (tablePerm.tablePermission === 'NONE') return [];
    const readScope = tablePerm.record.readScope;
    const editScope = tablePerm.record.editScope;
    return records.filter((r) => matchesScope(readScope, { createdByUserId: r.createdByUserId, data: (r.data ?? {}) }, userId, editScope));
  }

  assertCanCreate(tablePerm: EffectiveTablePermission) {
    this.requireAtLeast(tablePerm.tablePermission, 'EDIT');
    if (!tablePerm.record.canCreate) throw new ForbiddenException('No create permission');
  }

  assertCanDelete(tablePerm: EffectiveTablePermission) {
    this.requireAtLeast(tablePerm.tablePermission, 'EDIT');
    if (!tablePerm.record.canDelete) throw new ForbiddenException('No delete permission');
  }

  assertCanEditRecord(tablePerm: EffectiveTablePermission, record: { createdByUserId?: string | null; data: any }, userId: string) {
    this.requireAtLeast(tablePerm.tablePermission, 'EDIT');
    if (!matchesScope(tablePerm.record.editScope, { createdByUserId: record.createdByUserId, data: (record.data ?? {}) }, userId)) {
      throw new ForbiddenException('No edit permission');
    }
  }

  assertCanReadRecord(tablePerm: EffectiveTablePermission, record: { createdByUserId?: string | null; data: any }, userId: string) {
    this.requireAtLeast(tablePerm.tablePermission, 'READ');
    if (!matchesScope(tablePerm.record.readScope, { createdByUserId: record.createdByUserId, data: (record.data ?? {}) }, userId, tablePerm.record.editScope)) {
      throw new ForbiddenException('No read permission');
    }
  }

  assertFieldWritable(tablePerm: EffectiveTablePermission, fieldId: string, op: 'create' | 'edit') {
    if (tablePerm.tablePermission === 'MANAGE') return;
    if (tablePerm.tablePermission !== 'EDIT') throw new ForbiddenException('No write permission');
    if (tablePerm.fields.mode !== 'CUSTOM') return;
    const perm = tablePerm.fields.permsByFieldId?.[fieldId];
    if (!perm) return;
    if (op === 'create' && perm.canCreate === false) throw new ForbiddenException('No field create permission');
    if (op === 'edit' && perm.canEdit === false) throw new ForbiddenException('No field edit permission');
  }
}
