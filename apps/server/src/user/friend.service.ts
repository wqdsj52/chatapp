import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';

@Injectable()
export class FriendService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async getFriends(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { friends: true },
    });
    if (!user) throw new NotFoundException('用户不存在');
    return (user.friends || []).map(({ passwordHash, ...rest }) => rest);
  }

  async addFriend(userId: string, friendId: string) {
    if (userId === friendId) throw new ConflictException('不能添加自己为好友');
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { friends: true },
    });
    if (!user) throw new NotFoundException('用户不存在');
    const friend = await this.userRepo.findOneBy({ id: friendId });
    if (!friend) throw new NotFoundException('对方用户不存在');

    const alreadyFriend = user.friends?.some((f) => f.id === friendId);
    if (alreadyFriend) throw new ConflictException('已是好友');

    if (!user.friends) user.friends = [];
    user.friends.push(friend);
    await this.userRepo.save(user);
    return { success: true, message: '好友添加成功' };
  }

  async removeFriend(userId: string, friendId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { friends: true },
    });
    if (!user) throw new NotFoundException('用户不存在');
    user.friends = (user.friends || []).filter((f) => f.id !== friendId);
    await this.userRepo.save(user);
    return { success: true, message: '好友已删除' };
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
