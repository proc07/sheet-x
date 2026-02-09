import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdvancedPermissionsService } from '../advanced-permissions/advanced-permissions.service';
import { CreateRecordDto, PatchRecordDto } from './dto';

@Injectable()
export class RecordsService {
  constructor(
    private prisma: PrismaService,
    private advancedPermissions: AdvancedPermissionsService
  ) {}

  private async assertTableReadable(userId: string, tableId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { base: { select: { workspaceId: true } } },
    });
    if (!table) throw new ForbiddenException('Table not found');

    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: table.base.workspaceId, userId } },
      select: { role: true },
    });
    if (!m) throw new ForbiddenException('Not a member');
    return { role: m.role };
  }

  async list(userId: string, tableId: string) {
    await this.assertTableReadable(userId, tableId);
    const perm = await this.advancedPermissions.getEffectiveTablePermission(userId, tableId);
    if (perm.tablePermission === 'NONE') return [];

    const fields = await this.prisma.field.findMany({
      where: { tableId },
      select: { id: true },
    });

    const records = await this.prisma.record.findMany({
      where: { tableId, deletedAt: null },
      select: { id: true, data: true, revision: true, createdAt: true, updatedAt: true, createdByUserId: true },
      orderBy: { createdAt: 'desc' },
    });

    const scoped = this.advancedPermissions.filterRecordsByScope(perm, records as any, userId) as any[];
    return scoped.map((r) => ({
      ...r,
      data: this.advancedPermissions.filterRecordData(perm, r.data, fields),
    }));
  }

  async create(userId: string, dto: CreateRecordDto) {
    await this.assertTableReadable(userId, dto.tableId);
    const perm = await this.advancedPermissions.getEffectiveTablePermission(userId, dto.tableId);
    this.advancedPermissions.assertCanCreate(perm);

    const payload = (dto.data ?? {}) as Record<string, any>;
    for (const fieldId of Object.keys(payload)) {
      this.advancedPermissions.assertFieldWritable(perm, fieldId, 'create');
    }

    const created = await this.prisma.record.create({
      data: { tableId: dto.tableId, data: payload, createdByUserId: userId, updatedByUserId: userId },
      select: { id: true, data: true, revision: true, createdAt: true, updatedAt: true, createdByUserId: true },
    });

    const fields = await this.prisma.field.findMany({ where: { tableId: dto.tableId }, select: { id: true } });
    return { ...created, data: this.advancedPermissions.filterRecordData(perm, created.data, fields) };
  }

  async patch(userId: string, recordId: string, dto: PatchRecordDto) {
    const record = await this.prisma.record.findUnique({
      where: { id: recordId },
      select: { id: true, tableId: true, data: true, revision: true, deletedAt: true, createdByUserId: true },
    });
    if (!record || record.deletedAt) throw new NotFoundException('Record not found');

    await this.assertTableReadable(userId, record.tableId);
    const perm = await this.advancedPermissions.getEffectiveTablePermission(userId, record.tableId);
    this.advancedPermissions.assertCanEditRecord(perm, record, userId);

    if (record.revision !== dto.revision) {
      throw new ConflictException({
        message: 'Revision conflict',
        serverRevision: record.revision,
      });
    }

    const patch = (dto.data ?? {}) as Record<string, any>;
    for (const fieldId of Object.keys(patch)) {
      this.advancedPermissions.assertFieldWritable(perm, fieldId, 'edit');
    }
    const nextData = { ...(record.data as any), ...patch };

    const updated = await this.prisma.record.update({
      where: { id: recordId },
      data: {
        data: nextData,
        revision: record.revision + 1,
        updatedByUserId: userId,
      },
      select: { id: true, data: true, revision: true, updatedAt: true, createdByUserId: true },
    });
    const fields = await this.prisma.field.findMany({ where: { tableId: record.tableId }, select: { id: true } });
    return { ...updated, data: this.advancedPermissions.filterRecordData(perm, updated.data, fields) };
  }

  async softDelete(userId: string, recordId: string) {
    const record = await this.prisma.record.findUnique({
      where: { id: recordId },
      select: { id: true, tableId: true, deletedAt: true, createdByUserId: true, data: true },
    });
    if (!record || record.deletedAt) throw new NotFoundException('Record not found');

    await this.assertTableReadable(userId, record.tableId);
    const perm = await this.advancedPermissions.getEffectiveTablePermission(userId, record.tableId);
    this.advancedPermissions.assertCanDelete(perm);
    this.advancedPermissions.assertCanEditRecord(perm, record, userId);

    return this.prisma.record.update({
      where: { id: recordId },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }
}
