import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto, PatchRecordDto } from './dto';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.record.findMany({
      where: { tableId, deletedAt: null },
      select: { id: true, data: true, revision: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateRecordDto) {
    const { role } = await this.assertTableReadable(userId, dto.tableId);
    if (role === 'VIEWER') throw new ForbiddenException('No write permission');

    return this.prisma.record.create({
      data: { tableId: dto.tableId, data: dto.data ?? {} },
      select: { id: true, data: true, revision: true, createdAt: true, updatedAt: true },
    });
  }

  async patch(userId: string, recordId: string, dto: PatchRecordDto) {
    const record = await this.prisma.record.findUnique({
      where: { id: recordId },
      select: { id: true, tableId: true, data: true, revision: true, deletedAt: true },
    });
    if (!record || record.deletedAt) throw new NotFoundException('Record not found');

    const { role } = await this.assertTableReadable(userId, record.tableId);
    if (role === 'VIEWER') throw new ForbiddenException('No write permission');

    if (record.revision !== dto.revision) {
      throw new ConflictException({
        message: 'Revision conflict',
        serverRevision: record.revision,
      });
    }

    const nextData = { ...(record.data as any), ...(dto.data ?? {}) };

    return this.prisma.record.update({
      where: { id: recordId },
      data: {
        data: nextData,
        revision: record.revision + 1,
      },
      select: { id: true, data: true, revision: true, updatedAt: true },
    });
  }

  async softDelete(userId: string, recordId: string) {
    const record = await this.prisma.record.findUnique({
      where: { id: recordId },
      select: { id: true, tableId: true, deletedAt: true },
    });
    if (!record || record.deletedAt) throw new NotFoundException('Record not found');

    const { role } = await this.assertTableReadable(userId, record.tableId);
    if (role === 'VIEWER') throw new ForbiddenException('No write permission');

    return this.prisma.record.update({
      where: { id: recordId },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }
}
