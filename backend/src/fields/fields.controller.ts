import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { CreateFieldDto } from './dto';
import { FieldsService } from './fields.service';

@Controller('fields')
@UseGuards(JwtAuthGuard)
export class FieldsController {
  constructor(private svc: FieldsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query('tableId') tableId: string) {
    return this.svc.list(user.sub, tableId);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateFieldDto) {
    return this.svc.create(user.sub, dto);
  }
}
