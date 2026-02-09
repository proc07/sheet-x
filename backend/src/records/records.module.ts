import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { AdvancedPermissionsModule } from '../advanced-permissions/advanced-permissions.module';

@Module({
  imports: [AdvancedPermissionsModule],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
