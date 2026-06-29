import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FriendService } from './friend.service';

@Controller('friends')
@UseGuards(AuthGuard('jwt'))
export class FriendController {
  constructor(private friendService: FriendService) {}

  @Get()
  getFriends(@Req() req: any) {
    return this.friendService.getFriends(req.user.userId);
  }

  @Post('request/:id')
  sendRequest(@Req() req: any, @Param('id') toUserId: string) {
    return this.friendService.sendRequest(req.user.userId, toUserId);
  }

  @Get('requests/pending')
  getPendingRequests(@Req() req: any) {
    return this.friendService.getPendingRequests(req.user.userId);
  }

  @Post('requests/:id/accept')
  acceptRequest(@Req() req: any, @Param('id') requestId: string) {
    return this.friendService.acceptRequest(requestId, req.user.userId);
  }

  @Post('requests/:id/reject')
  rejectRequest(@Req() req: any, @Param('id') requestId: string) {
    return this.friendService.rejectRequest(requestId, req.user.userId);
  }

  @Post(':id')
  addFriend(@Req() req: any, @Param('id') friendId: string) {
    return this.friendService.sendRequest(req.user.userId, friendId);
  }

  @Delete(':id')
  removeFriend(@Req() req: any, @Param('id') friendId: string) {
    return this.friendService.removeFriend(req.user.userId, friendId);
  }

  @Get(':id/check')
  checkFriend(@Req() req: any, @Param('id') friendId: string) {
    return this.friendService.isFriend(req.user.userId, friendId).then((isFriend) => ({ isFriend }));
  }
}
