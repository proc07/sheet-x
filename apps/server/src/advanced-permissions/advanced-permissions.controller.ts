import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { AdvancedPermissionsService } from './advanced-permissions.service';

@Controller('advanced-permissions')
@UseGuards(JwtAuthGuard)
export class AdvancedPermissionsController {
  constructor(private svc: AdvancedPermissionsService) {}
  
  // 获取指定 base 的权限配置
  @Get('bases/:baseId')
  getBase(@CurrentUser() user: JwtUser, @Param('baseId') baseId: string) {
    return this.svc.getBaseConfigForManage(user.sub, baseId);
  }

  // 更新指定 base 的权限配置
  @Put('bases/:baseId')
  updateBase(
    @CurrentUser() user: JwtUser,
    @Param('baseId') baseId: string,
    @Body() body: { enabled?: boolean; allowShareGrant?: boolean; config?: any }
  ) {
    return this.svc.updateBaseConfig(user.sub, baseId, body);
  }

  // 获取指定 table 的我的权限
  @Get('tables/:tableId/me')
  getMyTablePermission(@CurrentUser() user: JwtUser, @Param('tableId') tableId: string) {
    return this.svc.getEffectiveTablePermission(user.sub, tableId);
  }
}

