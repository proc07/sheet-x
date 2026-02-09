import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { AddWorkspaceMemberDto, CreateWorkspaceDto } from './dto';
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

  @Get(':workspaceId/members')
  listMembers(@CurrentUser() user: JwtUser, @Param('workspaceId') workspaceId: string) {
    return this.svc.listMembers(user.sub, workspaceId);
  }

  @Post(':workspaceId/members')
  addMember(@CurrentUser() user: JwtUser, @Param('workspaceId') workspaceId: string, @Body() dto: AddWorkspaceMemberDto) {
    return this.svc.addMember(user.sub, workspaceId, dto);
  }
}
