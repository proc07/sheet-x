import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFieldDto } from './dto';

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
}
