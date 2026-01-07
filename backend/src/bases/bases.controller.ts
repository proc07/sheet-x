import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { CreateBaseDto } from './dto';
import { BasesService } from './bases.service';

@Controller('bases')
@UseGuards(JwtAuthGuard)
export class BasesController {
  constructor(private svc: BasesService) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query('workspaceId') workspaceId: string) {
    return this.svc.list(workspaceId, user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateBaseDto) {
    return this.svc.create(user.sub, dto);
  }
}
