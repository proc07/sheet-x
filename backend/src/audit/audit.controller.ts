import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: JwtUser, @Query('workspaceId') workspaceId?: string, @Query('baseId') baseId?: string) {
    const wid = workspaceId ?? (baseId ? await this.getWorkspaceIdByBase(baseId) : '');
    if (!wid) return [];

    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: wid, userId: user.sub } },
      select: { role: true },
    });
    // 只有 Workspace 成员的角色是 OWNER 或 ADMIN 才可以查看审计日志
    if (!m || (m.role !== 'OWNER' && m.role !== 'ADMIN')) return [];

    return this.prisma.auditLog.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(baseId ? { baseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        createdAt: true,
        actorUserId: true,
        action: true,
        entityType: true,
        entityId: true,
        workspaceId: true,
        baseId: true,
        data: true,
      },
    });
  }

  private async getWorkspaceIdByBase(baseId: string) {
    const base = await this.prisma.base.findUnique({ where: { id: baseId }, select: { workspaceId: true } });
    return base?.workspaceId ?? '';
  }
}
