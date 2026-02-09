import { Module } from '@nestjs/common';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import { AdvancedPermissionsModule } from '../advanced-permissions/advanced-permissions.module';

@Module({
  imports: [AdvancedPermissionsModule],
  controllers: [FieldsController],
  providers: [FieldsService],
})
export class FieldsModule {}
