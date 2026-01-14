import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFieldDto, UpdateFieldLayoutDto } from './dto';

const DEFAULT_FIELD_WIDTH = 120;

@Injectable()
export class FieldsService {
  constructor(private prisma: PrismaService) {}

  private async assertTableWrite(userId: string, tableId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { base: { select: { workspaceId: true } } },
    });
    if (!table) throw new ForbiddenException('Table not found');

    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: table.base.workspaceId, userId } },
      select: { role: true },
    });
    if (!m || m.role === 'VIEWER') throw new ForbiddenException('No write permission');
  }

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
  }

  async list(userId: string, tableId: string) {
    await this.assertTableReadable(userId, tableId);
    return this.prisma.field.findMany({
      where: { tableId },
      select: { id: true, name: true, type: true, required: true, options: true, position: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateFieldDto) {
    await this.assertTableWrite(userId, dto.tableId);

    const position = dto.position ?? 0;
    return this.prisma.field.create({
      data: {
        tableId: dto.tableId,
        name: dto.name,
        type: dto.type,
        options: dto.options ?? undefined,
        required: dto.required ?? false,
        position,
      },
      select: { id: true, name: true, type: true, required: true, options: true, position: true },
    });
  }

  async updateLayout(userId: string, dto: UpdateFieldLayoutDto) {
    if (!dto.tableId) {
      throw new BadRequestException('tableId is required');
    }
    if (!Array.isArray(dto.fields) || dto.fields.length === 0) {
      throw new BadRequestException('fields is required');
    }
    // Ensure the caller can mutate fields for this table.
    await this.assertTableWrite(userId, dto.tableId);

    const fieldIds = dto.fields.map((field) => field.id).filter(Boolean);
    if (fieldIds.length === 0) {
      throw new BadRequestException('fields is required');
    }

    // Load current options so width updates can merge without clobbering.
    const storedFields = await this.prisma.field.findMany({
      where: { tableId: dto.tableId, id: { in: fieldIds } },
      select: { id: true, options: true },
    });
    if (storedFields.length !== fieldIds.length) {
      throw new ForbiddenException('Field not found');
    }

    const optionsMap = new Map(
      storedFields.map((field) => [field.id, (field.options ?? {}) as Record<string, any>])
    );

    const updates: Prisma.PrismaPromise<any>[] = [];
    for (const field of dto.fields) {
      const data: { position?: number; options?: Record<string, any> } = {};
      // Normalize inputs; only persist valid numeric updates.
      if (typeof field.position === 'number' && Number.isFinite(field.position)) {
        data.position = Math.max(0, Math.trunc(field.position));
      }
      const baseOptions = optionsMap.get(field.id) ?? {};
      let nextOptions: Record<string, any> | null = null;
      if (typeof field.width === 'number' && Number.isFinite(field.width)) {
        nextOptions = { ...(nextOptions ?? baseOptions), width: Math.max(DEFAULT_FIELD_WIDTH, Math.trunc(field.width)) };
      }
      if (typeof field.hidden === 'boolean') {
        nextOptions = { ...(nextOptions ?? baseOptions), hidden: field.hidden };
      }
      if (typeof field.statType === 'string') {
        nextOptions = { ...(nextOptions ?? baseOptions), statType: field.statType };
      }
      if (nextOptions) {
        data.options = nextOptions;
      }
      if (Object.keys(data).length === 0) {
        continue;
      }
      updates.push(
        this.prisma.field.update({
          where: { id: field.id },
          data,
          select: { id: true, name: true, type: true, required: true, options: true, position: true },
        })
      );
    }

    if (updates.length === 0) {
      return [];
    }

    // Apply all layout changes together to keep the order consistent.
    return this.prisma.$transaction(updates);
  }
}
