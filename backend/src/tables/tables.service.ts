import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto, UpdateTableDto } from './dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  private async assertBaseReadable(userId: string, baseId: string) {
    const base = await this.prisma.base.findUnique({
      where: { id: baseId },
      select: { workspaceId: true },
    });
    if (!base) throw new ForbiddenException('Base not found');

    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: base.workspaceId, userId } },
      select: { role: true },
    });
    if (!m) throw new ForbiddenException('Not a member');
    return { workspaceId: base.workspaceId, role: m.role };
  }

  async create(userId: string, dto: CreateTableDto) {
    const { role } = await this.assertBaseReadable(userId, dto.baseId);
    if (role === 'VIEWER') throw new ForbiddenException('No write permission');

    return this.prisma.table.create({
      data: { name: dto.name, baseId: dto.baseId },
      select: { id: true, name: true, baseId: true, rowHeight: true, createdAt: true },
    });
  }

  async list(userId: string, baseId: string) {
    await this.assertBaseReadable(userId, baseId);
    return this.prisma.table.findMany({
      where: { baseId },
      select: { id: true, name: true, rowHeight: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(userId: string, tableId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, name: true, baseId: true, rowHeight: true },
    });
    if (!table) throw new ForbiddenException('Table not found');
    await this.assertBaseReadable(userId, table.baseId);

    return table;
  }

  async update(userId: string, tableId: string, dto: UpdateTableDto) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, baseId: true },
    });
    if (!table) throw new ForbiddenException('Table not found');
    const { role } = await this.assertBaseReadable(userId, table.baseId);
    if (role === 'VIEWER') throw new ForbiddenException('No write permission');

    const data: { name?: string; rowHeight?: number } = {};
    if (dto.name) {
      data.name = dto.name;
    }
    if (typeof dto.rowHeight === 'number') {
      data.rowHeight = dto.rowHeight;
    }

    return this.prisma.table.update({
      where: { id: tableId },
      data,
      select: { id: true, name: true, rowHeight: true, createdAt: true },
    });
  }

  async remove(userId: string, tableId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, baseId: true },
    });
    if (!table) throw new ForbiddenException('Table not found');
    const { role } = await this.assertBaseReadable(userId, table.baseId);
    if (role === 'VIEWER') throw new ForbiddenException('No write permission');

    return this.prisma.table.delete({
      where: { id: tableId },
      select: { id: true },
    });
  }

  async getStats(userId: string, tableId: string, fieldId: string, type: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, baseId: true },
    });
    if (!table) throw new ForbiddenException('Table not found');
    await this.assertBaseReadable(userId, table.baseId);

    // Fetch all records data to calculate stats in memory (MVP approach)
    const records = await this.prisma.record.findMany({
      where: { tableId, deletedAt: null },
      select: { data: true },
    });

    const total = records.length;
    let emptyCount = 0;

    for (const record of records) {
      const val = (record.data as any)[fieldId];
      // Consider null, undefined, or empty string as empty
      if (val === null || val === undefined || val === '') {
        emptyCount++;
      }
    }

    const filledCount = total - emptyCount;
    let result: number | string = 0;

    switch (type) {
      case 'countAll':
        result = total;
        break;
      case 'empty':
        result = emptyCount;
        break;
      case 'filled':
        result = filledCount;
        break;
      case 'percentEmpty':
        result = total === 0 ? 0 : (emptyCount / total) * 100;
        break;
      case 'percentFilled':
        result = total === 0 ? 0 : (filledCount / total) * 100;
        break;
      default:
        result = 0;
    }

    return { type, value: result };
  }

  async getBatchStats(userId: string, tableId: string, requests: { fieldId: string; type: string }[]) {
    if (!requests || requests.length === 0) return [];

    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, baseId: true },
    });
    if (!table) throw new ForbiddenException('Table not found');
    await this.assertBaseReadable(userId, table.baseId);

    // Fetch all records data once
    const records = await this.prisma.record.findMany({
      where: { tableId, deletedAt: null },
      select: { data: true },
    });

    const total = records.length;
    
    // Calculate stats for each request
    return requests.map((req) => {
      // Optimization: if type is none, skip calculation
      if (req.type === 'none') return { fieldId: req.fieldId, type: req.type, value: 0 };

      let emptyCount = 0;
      for (const record of records) {
        const val = (record.data as any)[req.fieldId];
        if (val === null || val === undefined || val === '') {
          emptyCount++;
        }
      }

      const filledCount = total - emptyCount;
      let result: number | string = 0;

      switch (req.type) {
        case 'countAll':
          result = total;
          break;
        case 'empty':
          result = emptyCount;
          break;
        case 'filled':
          result = filledCount;
          break;
        case 'percentEmpty':
          result = total === 0 ? 0 : (emptyCount / total) * 100;
          break;
        case 'percentFilled':
          result = total === 0 ? 0 : (filledCount / total) * 100;
          break;
        default:
          result = 0;
      }

      return { fieldId: req.fieldId, type: req.type, value: result };
    });
  }
}
