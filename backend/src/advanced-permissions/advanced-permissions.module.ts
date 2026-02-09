import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdvancedPermissionsController } from './advanced-permissions.controller';
import { AdvancedPermissionsService } from './advanced-permissions.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AdvancedPermissionsController],
  providers: [AdvancedPermissionsService],
  exports: [AdvancedPermissionsService],
})
export class AdvancedPermissionsModule {}

