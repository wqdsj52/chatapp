import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.userService.getProfile(req.user.userId);
  }

  @Patch('me')
  updateMe(@Req() req: any, @Body() body: { nickname?: string; avatarUrl?: string }) {
    return this.userService.updateProfile(req.user.userId, body);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.userService.searchUsers(q || '');
  }
}
