import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { BasesModule } from './bases/bases.module';
import { TablesModule } from './tables/tables.module';
import { FieldsModule } from './fields/fields.module';
import { RecordsModule } from './records/records.module';
import { ViewsModule } from './views/views.module';
import { StorageModule } from './storage/storage.module';
import { AdvancedPermissionsModule } from './advanced-permissions/advanced-permissions.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    BasesModule,
    TablesModule,
    FieldsModule,
    RecordsModule,
    ViewsModule,
    StorageModule,
    AuditModule,
    AdvancedPermissionsModule,
    UsersModule,
  ],
})
export class AppModule {}
