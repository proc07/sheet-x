import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AddWorkspaceMemberDto, CreateWorkspaceDto } from './dto';

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

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

  private async assertWorkspaceMember(userId: string, workspaceId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
    if (!m) throw new ForbiddenException('Not a member');
    return m;
  }

  async listMembers(userId: string, workspaceId: string) {
    await this.assertWorkspaceMember(userId, workspaceId);
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: { id: true, workspaceId: true, userId: true, role: true, user: { select: { id: true, email: true, name: true, avatarUrl: true } }, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(actorUserId: string, workspaceId: string, dto: AddWorkspaceMemberDto) {
    const actor = await this.assertWorkspaceMember(actorUserId, workspaceId);
    if (actor.role !== 'OWNER' && actor.role !== 'ADMIN') throw new ForbiddenException('No manage permission');

    const user = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true, email: true, name: true } });
    if (!user) throw new BadRequestException('User not found');

    const created = await this.prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      create: { workspaceId, userId: user.id, role: dto.role ?? 'VIEWER' },
      update: { role: dto.role ?? undefined },
      select: { id: true, workspaceId: true, userId: true, role: true, user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });

    await this.audit.log({
      actorUserId,
      action: 'WORKSPACE_MEMBER_UPSERT',
      entityType: 'WorkspaceMember',
      entityId: created.id,
      workspaceId,
      data: { email: dto.email, role: created.role },
    });

    return created;
  }
}
