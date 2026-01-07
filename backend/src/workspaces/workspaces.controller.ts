import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { CreateWorkspaceDto } from './dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private svc: WorkspacesService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.svc.listForUser(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateWorkspaceDto) {
    return this.svc.create(user.sub, dto);
  }
}
