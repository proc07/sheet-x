import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      select: { id: true, name: true, createdAt: true },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
