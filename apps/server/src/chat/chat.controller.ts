import { Body, Controller, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Post('sessions/:id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/chat',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.bin';
          cb(null, 'chat-' + uniqueSuffix + ext);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async uploadFile(@Req() req: any, @Param('id') sessionId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择文件');
    const host = req.protocol + '://' + req.get('host');
    const fileUrl = host + '/uploads/chat/' + file.filename;
    const isImage = file.mimetype.startsWith('image/');
    const type = isImage ? 'image' : 'file';
    const content = JSON.stringify({ url: fileUrl, name: file.originalname, size: file.size, mimeType: file.mimetype });
    return this.chatService.sendMessage(req.user.userId, sessionId, type as any, content);
  }
}
