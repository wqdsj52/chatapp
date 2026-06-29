import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, FriendRequest, Notification } from '../entities';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(FriendRequest) private requestRepo: Repository<FriendRequest>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async getFriends(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { friends: true },
    });
    if (!user) throw new NotFoundException('用户不存在');
    return (user.friends || []).map(({ passwordHash, ...rest }) => rest);
  }

  async sendRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) throw new ConflictException('不能添加自己为好友');

    const toUser = await this.userRepo.findOneBy({ id: toUserId });
    if (!toUser) throw new NotFoundException('对方用户不存在');

    // Check if already friends
    const fromUser = await this.userRepo.findOne({ where: { id: fromUserId }, relations: { friends: true } });
    if (fromUser?.friends?.some(f => f.id === toUserId)) {
      throw new ConflictException('你们已经是好友');
    }

    // Check for existing pending request in either direction
    const existing = await this.requestRepo.findOne({
      where: [
        { fromUserId, toUserId, status: 'pending' as any },
        { fromUserId: toUserId, toUserId: fromUserId, status: 'pending' as any },
      ],
    });
    if (existing) {
      if (existing.fromUserId === toUserId) {
        // The other person already sent us a request, auto-accept it
        return this.acceptRequest(existing.id, fromUserId);
      }
      throw new ConflictException('已发送过好友申请');
    }

    const request = this.requestRepo.create({ fromUserId, toUserId });
    const saved = await this.requestRepo.save(request);

    // Create notification for the recipient
    const fromUser2 = await this.userRepo.findOneBy({ id: fromUserId });
    const notif = this.notifRepo.create({
      userId: toUserId,
      type: 'friend_request',
      title: '好友申请',
      content: fromUser2?.nickname || fromUser2?.account || '用户' + ' 请求添加你为好友',
    });
    await this.notifRepo.save(notif);

    return { success: true, message: '好友申请已发送', requestId: saved.id };
  }

  async acceptRequest(requestId: string, userId: string) {
    const request = await this.requestRepo.findOne({
      where: { id: requestId, toUserId: userId, status: 'pending' as any },
    });
    if (!request) throw new NotFoundException('申请不存在或已处理');

    request.status = 'accepted';
    await this.requestRepo.save(request);

    // Add bidirectional friendship
    const fromUser = await this.userRepo.findOne({ where: { id: request.fromUserId }, relations: { friends: true } });
    const toUser = await this.userRepo.findOne({ where: { id: userId }, relations: { friends: true } });
    if (!fromUser || !toUser) throw new NotFoundException('用户不存在');

    if (!fromUser.friends) fromUser.friends = [];
    if (!toUser.friends) toUser.friends = [];
    if (!fromUser.friends.some(f => f.id === userId)) fromUser.friends.push(toUser);
    if (!toUser.friends.some(f => f.id === request.fromUserId)) toUser.friends.push(fromUser);
    await this.userRepo.save([fromUser, toUser]);

    // Notify the requester
    const notif = this.notifRepo.create({
      userId: request.fromUserId,
      type: 'system',
      title: '好友申请已通过',
      content: toUser.nickname || toUser.account + ' 已同意你的好友申请',
    });
    await this.notifRepo.save(notif);

    // Mark the original notification as read
    const origNotif = await this.notifRepo.findOne({
      where: { userId, type: 'friend_request' as any, title: '好友申请' },
      order: { createdAt: 'DESC' },
    });
    if (origNotif) { origNotif.read = true; await this.notifRepo.save(origNotif); }

    return { success: true, message: '已同意好友申请' };
  }

  async rejectRequest(requestId: string, userId: string) {
    const request = await this.requestRepo.findOne({
      where: { id: requestId, toUserId: userId, status: 'pending' as any },
    });
    if (!request) throw new NotFoundException('申请不存在或已处理');

    request.status = 'rejected';
    await this.requestRepo.save(request);

    // Mark the original notification as read
    const origNotif = await this.notifRepo.findOne({
      where: { userId, type: 'friend_request' as any, title: '好友申请' },
      order: { createdAt: 'DESC' },
    });
    if (origNotif) { origNotif.read = true; await this.notifRepo.save(origNotif); }

    return { success: true, message: '已拒绝好友申请' };
  }

  async getPendingRequests(userId: string) {
    const requests = await this.requestRepo.find({
      where: { toUserId: userId, status: 'pending' as any },
      relations: { fromUser: true },
      order: { createdAt: 'DESC' },
    });
    return requests.map(r => ({
      id: r.id,
      fromUser: r.fromUser ? { id: r.fromUser.id, nickname: r.fromUser.nickname, account: r.fromUser.account, avatarUrl: r.fromUser.avatarUrl, userCode: r.fromUser.userCode } : null,
      createdAt: r.createdAt,
    }));
  }

  async removeFriend(userId: string, friendId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { friends: true },
    });
    if (!user) throw new NotFoundException('用户不存在');
    user.friends = (user.friends || []).filter((f) => f.id !== friendId);
    await this.userRepo.save(user);
    return { success: true, message: '已删除好友' };
  }

  async isFriend(userId: string, friendId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { friends: true },
    });
    if (!user) return false;
    return (user.friends || []).some((f) => f.id === friendId);
  }
}
