import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBaseDto } from './dto';

@Injectable()
export class BasesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBaseDto) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: dto.workspaceId, userId } },
      select: { role: true },
    });
    if (!member || member.role === 'VIEWER') throw new ForbiddenException('No permission');

    return this.prisma.base.create({
      data: { name: dto.name, workspaceId: dto.workspaceId },
      select: { id: true, name: true, workspaceId: true, createdAt: true },
    });
  }

  async list(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
    if (!member) throw new ForbiddenException('Not a member');

    return this.prisma.base.findMany({
      where: { workspaceId },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
