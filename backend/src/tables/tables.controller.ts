import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { CreateTableDto, UpdateTableDto } from './dto';
import { TablesService } from './tables.service';

@Controller('tables')
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private svc: TablesService) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query('baseId') baseId: string) {
    return this.svc.list(user.sub, baseId);
  }

  @Get(':tableId')
  get(@CurrentUser() user: JwtUser, @Param('tableId') tableId: string) {
    return this.svc.get(user.sub, tableId);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateTableDto) {
    return this.svc.create(user.sub, dto);
  }

  @Patch(':tableId')
  update(@CurrentUser() user: JwtUser, @Param('tableId') tableId: string, @Body() dto: UpdateTableDto) {
    return this.svc.update(user.sub, tableId, dto);
  }
}
