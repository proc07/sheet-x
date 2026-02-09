import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { UpdateMeDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return this.svc.getMe(user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateMeDto) {
    return this.svc.updateMe(user.sub, dto);
  }
}

