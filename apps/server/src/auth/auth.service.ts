import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(phone: string, account: string, password: string, nickname?: string, userCode?: string) {
    const existingPhone = await this.userRepo.findOneBy({ phone });
    if (existingPhone) throw new ConflictException('\u624b\u673a\u53f7\u5df2\u6ce8\u518c');
    const existingAccount = await this.userRepo.findOneBy({ account });
    if (existingAccount) throw new ConflictException('\u8d26\u53f7\u5df2\u5b58\u5728');
    if (userCode) {
      const existingCode = await this.userRepo.findOneBy({ userCode });
      if (existingCode) throw new ConflictException('\u4ee3\u53f7\u5df2\u88ab\u5360\u7528');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      phone, account, passwordHash,
      nickname: nickname || \u7528\u6237,
      userCode: userCode || null,
    });
    await this.userRepo.save(user);
    return this.signToken(user.id, user.account);
  }

  async loginByAccount(account: string, password: string) {
    const user = await this.userRepo.findOneBy({ account });
    if (!user) throw new UnauthorizedException('\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef');
    const { passwordHash, ...rest } = user;
    const { accessToken } = this.signToken(user.id, user.account, user.role);
    return { accessToken, user: rest };
  }

  async loginByPhone(phone: string, code: string) {
    if (!/^\d{6}$/.test(code)) throw new UnauthorizedException('\u9a8c\u8bc1\u7801\u683c\u5f0f\u9519\u8bef');
    let user = await this.userRepo.findOneBy({ phone });
    if (!user) {
      const passwordHash = await bcrypt.hash('123456', 10);
      user = this.userRepo.create({
        phone, account: user_, passwordHash,
        nickname: \u7528\u6237,
      });
      await this.userRepo.save(user);
    }
    const { passwordHash, ...rest } = user;
    const { accessToken } = this.signToken(user.id, user.account, user.role);
    return { accessToken, user: rest };
  }

  private signToken(userId: string, account: string, role?: string) {
    return { accessToken: this.jwtService.sign({ sub: userId, account, role: role || 'user' }) };
  }
}