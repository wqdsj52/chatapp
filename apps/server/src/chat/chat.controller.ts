import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('sessions')
  getSessions(@Req() req: any) {
    return this.chatService.getSessions(req.user.userId);
  }

  @Post('sessions/single')
  createSingle(@Req() req: any, @Body() body: { targetUserId: string }) {
    return this.chatService.createSingleSession(req.user.userId, body.targetUserId);
  }

  @Post('sessions/group')
  createGroup(@Req() req: any, @Body() body: { memberIds: string[]; name: string }) {
    return this.chatService.createGroupSession(req.user.userId, body.memberIds, body.name);
  }

  @Get('sessions/:id/messages')
  getMessages(@Req() req: any, @Param('id') sessionId: string, @Query('cursor') cursor?: string) {
    return this.chatService.getMessages(req.user.userId, sessionId, cursor);
  }

  @Post('sessions/:id/messages')
  sendMessage(@Req() req: any, @Param('id') sessionId: string, @Body() body: { type: string; content: string }) {
    return this.chatService.sendMessage(req.user.userId, sessionId, body.type as any, body.content);
  }
}
