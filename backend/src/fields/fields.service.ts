import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Field, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdvancedPermissionsService } from '../advanced-permissions/advanced-permissions.service';
import { CreateFieldDto, UpdateFieldDto, UpdateFieldLayoutDto } from './dto';

@Injectable()
export class FieldsService {
  constructor(
    private prisma: PrismaService,
    private advancedPermissions: AdvancedPermissionsService
  ) {}

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

    const perm = await this.advancedPermissions.getEffectiveTablePermission(userId, tableId);
    if (perm.enabled && perm.tablePermission !== 'MANAGE') throw new ForbiddenException('No manage permission');
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
    const fields = await this.prisma.field.findMany({
      where: { tableId },
      select: { id: true, name: true, type: true, required: true, config: true, position: true, width: true, hidden: true, frozen: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    const perm = await this.advancedPermissions.getEffectiveTablePermission(userId, tableId);
    return this.advancedPermissions.filterFields(perm, fields);
  }

  private async assertFieldWrite(userId: string, fieldId: string) {
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      select: { tableId: true },
    });
    if (!field) throw new BadRequestException('Field not found');
    await this.assertTableWrite(userId, field.tableId);
  }

  async update(userId: string, id: string, dto: UpdateFieldDto) {
    await this.assertFieldWrite(userId, id);
    return this.prisma.field.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        config: dto.config ?? undefined,
        required: dto.required,
      },
      select: { id: true, name: true, type: true, required: true, config: true, position: true, width: true, hidden: true, frozen: true },
    });
  }

  async delete(userId: string, id: string) {
    await this.assertFieldWrite(userId, id);
    return this.prisma.field.delete({
      where: { id },
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
        config: dto.config ?? undefined,
        required: dto.required ?? false,
        position,
      },
      select: { id: true, name: true, type: true, required: true, config: true, position: true, width: true, hidden: true, frozen: true },
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

    // Load current config so we can merge partial updates like statType
    const storedFields = await this.prisma.field.findMany({
      where: { tableId: dto.tableId, id: { in: fieldIds } },
      select: { id: true, config: true },
    });
    if (storedFields.length !== fieldIds.length) {
      throw new ForbiddenException('Field not found');
    }

    const configMap = new Map(
      storedFields.map((field) => [field.id, (field.config ?? {}) as Record<string, any>])
    );

    const updates: Prisma.PrismaPromise<any>[] = [];
    for (const field of dto.fields) {
      const data: Prisma.FieldUpdateInput = {};
      // DTO validation ensures types are correct if present
      if (field.position !== undefined) {
        data.position = field.position;
      }
      if (field.width !== undefined) {
        data.width = field.width;
      }
      if (field.hidden !== undefined) {
        data.hidden = field.hidden;
      }
      if (field.frozen !== undefined) {
        data.frozen = field.frozen;
      }

      // Config merging
      const baseConfig = configMap.get(field.id) ?? {};
      let nextConfig: Record<string, any> | null = null;
      
      if (field.config) {
        nextConfig = { ...baseConfig, ...field.config };
      }

      // Purpose of statType:
      // Specifies the statistical type for the field, such as sum, count, average, etc.
      // When set to 'none', no statistics are calculated.
      if (field.statType !== undefined) {
        nextConfig = { ...(nextConfig ?? baseConfig), statType: field.statType };
      }

      if (nextConfig) {
        data.config = nextConfig;
      }

      if (Object.keys(data).length === 0) {
        continue;
      }
      updates.push(
        this.prisma.field.update({
          where: { id: field.id },
          data,
          select: { id: true, name: true, type: true, required: true, config: true, position: true, width: true, hidden: true, frozen: true },
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
