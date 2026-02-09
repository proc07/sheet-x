import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { AdvancedPermissionsModule } from '../advanced-permissions/advanced-permissions.module';

@Module({
  imports: [AdvancedPermissionsModule],
  controllers: [TablesController],
  providers: [TablesService],
})
export class TablesModule {}
