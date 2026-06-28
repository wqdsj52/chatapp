import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('用户不存在');
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async updateProfile(userId: string, data: { nickname?: string; avatarUrl?: string }) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('用户不存在');
    if (data.nickname) user.nickname = data.nickname;
    if (data.avatarUrl) user.avatarUrl = data.avatarUrl;
    await this.userRepo.save(user);
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async searchUsers(keyword: string) {
    if (!keyword) return [];
    const users = await this.userRepo.find({
      where: [
        { nickname: Like(`%${keyword}%`) },
        { account: Like(`%${keyword}%`) },
        { phone: Like(`%${keyword}%`) },
      ],
      take: 20,
    });
    return users.map(({ passwordHash, ...rest }) => rest);
  }
}
