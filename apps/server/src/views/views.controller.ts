import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { CreateViewDto } from './dto';
import { ViewsService } from './views.service';

@Controller('views')
@UseGuards(JwtAuthGuard)
export class ViewsController {
  constructor(private svc: ViewsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query('tableId') tableId: string) {
    return this.svc.list(user.sub, tableId);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateViewDto) {
    return this.svc.create(user.sub, dto);
  }
}
