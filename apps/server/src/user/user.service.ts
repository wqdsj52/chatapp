import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('\u7528\u6237\u4e0d\u5b58\u5728');
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async updateProfile(userId: string, data: { nickname?: string; avatarUrl?: string; userCode?: string }) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('\u7528\u6237\u4e0d\u5b58\u5728');
    if (data.nickname) user.nickname = data.nickname;
    if (data.avatarUrl) user.avatarUrl = data.avatarUrl;
    if (data.userCode !== undefined) {
      if (data.userCode) {
        const existing = await this.userRepo.findOneBy({ userCode: data.userCode });
        if (existing && existing.id !== userId) throw new NotFoundException('\u4ee3\u53f7\u5df2\u88ab\u5360\u7528');
      }
      user.userCode = data.userCode || null as any;
    }
    await this.userRepo.save(user);
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async searchUsers(keyword: string) {
    if (!keyword) return [];
    const users = await this.userRepo.find({
      where: [
        { nickname: Like(%%) },
        { account: Like(%%) },
        { phone: Like(%%) },
        { userCode: Like(%%) },
      ],
      take: 20,
    });
    return users.map(({ passwordHash, ...rest }) => rest);
  }
}