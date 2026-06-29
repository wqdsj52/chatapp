import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
@UseGuards(AuthGuard('jwt'))
export class FeedbackController {
  constructor(private svc: FeedbackService) {}

  @Post()
  create(@Req() req: any, @Body() body: { type: string; content: string; contact?: string }) {
    return this.svc.create(req.user.id, body);
  }

  @Get()
  findMine(@Req() req: any) {
    return this.svc.findByUser(req.user.id);
  }
}
