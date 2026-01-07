import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateViewDto } from './dto';

@Injectable()
export class ViewsService {
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
  }

  async list(userId: string, tableId: string) {
    await this.assertTableReadable(userId, tableId);
    return this.prisma.view.findMany({
      where: { tableId },
      select: { id: true, name: true, type: true, config: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(userId: string, dto: CreateViewDto) {
    await this.assertTableReadable(userId, dto.tableId);
    return this.prisma.view.create({
      data: {
        tableId: dto.tableId,
        name: dto.name,
        type: dto.type ?? 'GRID',
        config: dto.config ?? undefined,
      },
      select: { id: true, name: true, type: true, config: true, createdAt: true },
    });
  }
}
