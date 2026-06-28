import { Controller, Delete, Get, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private adminService: AdminService) {}

  private ensureAdmin(req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('仅管理员可访问');
  }

  @Get('stats')
  getStats(@Req() req: any) {
    this.ensureAdmin(req);
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(@Req() req: any, @Query('q') q?: string) {
    this.ensureAdmin(req);
    return this.adminService.getUsers(q);
  }

  @Get('users/:id')
  getUserDetail(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.adminService.getUserDetail(id);
  }

  @Delete('users/:id')
  deleteUser(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.adminService.deleteUser(id);
  }

  @Get('sessions')
  getSessions(@Req() req: any, @Query('q') q?: string) {
    this.ensureAdmin(req);
    return this.adminService.getSessions(q);
  }

  @Delete('sessions/:id')
  deleteSession(@Req() req: any, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.adminService.deleteSession(id);
  }

  @Get('sessions/:id/messages')
  getMessages(@Req() req: any, @Param('id') sessionId: string, @Query('q') q?: string) {
    this.ensureAdmin(req);
    return this.adminService.getMessages(sessionId, q);
  }

  @Delete('sessions/:sessionId/messages/:messageId')
  deleteMessage(@Req() req: any, @Param('sessionId') sessionId: string, @Param('messageId') messageId: string) {
    this.ensureAdmin(req);
    return this.adminService.deleteMessage(sessionId, messageId);
  }
}