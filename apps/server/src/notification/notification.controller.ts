import { Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private notifService: NotificationService) {}

  @Get()
  getNotifications(@Req() req: any) {
    return this.notifService.getUserNotifications(req.user.userId);
  }

  @Patch(':id/read')
  async markRead(@Req() req: any, @Param('id') id: string) {
    return { success: await this.notifService.markRead(req.user.userId, id) };
  }

  @Post('read-all')
  async markAllRead(@Req() req: any) {
    return { success: await this.notifService.markAllRead(req.user.userId) };
  }
}
