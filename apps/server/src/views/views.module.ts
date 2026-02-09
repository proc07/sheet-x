import { Module } from '@nestjs/common';
import { ViewsController } from './views.controller';
import { ViewsService } from './views.service';
import { AdvancedPermissionsModule } from '../advanced-permissions/advanced-permissions.module';

@Module({
  imports: [AdvancedPermissionsModule],
  controllers: [ViewsController],
  providers: [ViewsService],
})
export class ViewsModule {}
