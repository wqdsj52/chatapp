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

  async getUserById(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('用户不存在');
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async updateProfile(userId: string, data: any) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('用户不存在');
    const fields = ['nickname', 'avatarUrl', 'gender', 'birthDate', 'bio', 'city', 'province', 'address'];
    for (const f of fields) {
      if (data[f] !== undefined) user[f] = data[f];
    }
    if (data.userCode !== undefined) {
      if (data.userCode) {
        const existing = await this.userRepo.findOneBy({ userCode: data.userCode });
        if (existing && existing.id !== userId) throw new NotFoundException('代号已被占用');
      }
      user.userCode = data.userCode || null;
    }
    await this.userRepo.save(user);
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async searchUsers(keyword: string) {
    if (!keyword) return [];
    const users = await this.userRepo.find({
      where: [
        { nickname: Like('%' + keyword + '%') },
        { account: Like('%' + keyword + '%') },
        { phone: Like('%' + keyword + '%') },
        { userCode: Like('%' + keyword + '%') },
      ],
      take: 20,
    });
    return users.map(({ passwordHash, ...rest }) => rest);
  }
}
