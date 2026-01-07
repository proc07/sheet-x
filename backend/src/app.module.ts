import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { BasesModule } from './bases/bases.module';
import { TablesModule } from './tables/tables.module';
import { FieldsModule } from './fields/fields.module';
import { RecordsModule } from './records/records.module';
import { ViewsModule } from './views/views.module';

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
  ],
})
export class AppModule {}
