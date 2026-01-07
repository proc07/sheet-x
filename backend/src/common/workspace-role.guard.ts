import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 简化版：只要是 workspace member 就允许；如果要写入，要求 role != VIEWER
 * 用法：new WorkspaceRoleGuard({ requireWrite: true })
 */
@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(private prisma: PrismaService, private opts: { requireWrite?: boolean } = {}) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { sub: string };

    const workspaceId =
      req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('workspaceId is required');
    }

    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.sub } },
      select: { role: true },
    });

    if (!m) throw new ForbiddenException('Not a member of workspace');
    if (this.opts.requireWrite && m.role === 'VIEWER') throw new ForbiddenException('No write permission');
    return true;
  }
}
