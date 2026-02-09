import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { CreateRecordDto, PatchRecordDto } from './dto';
import { RecordsService } from './records.service';

@Controller('records')
@UseGuards(JwtAuthGuard)
export class RecordsController {
  constructor(private svc: RecordsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query('tableId') tableId: string) {
    return this.svc.list(user.sub, tableId);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateRecordDto) {
    return this.svc.create(user.sub, dto);
  }

  @Patch(':recordId')
  patch(@CurrentUser() user: JwtUser, @Param('recordId') recordId: string, @Body() dto: PatchRecordDto) {
    return this.svc.patch(user.sub, recordId, dto);
  }

  @Delete(':recordId')
  remove(@CurrentUser() user: JwtUser, @Param('recordId') recordId: string) {
    return this.svc.softDelete(user.sub, recordId);
  }
}
