import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    workspaceId?: string;
    baseId?: string;
    data?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        workspaceId: input.workspaceId ?? null,
        baseId: input.baseId ?? null,
        data: input.data ?? undefined,
      },
      select: { id: true },
    });
  }
}

