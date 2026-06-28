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

  async register(phone: string, account: string, password: string, nickname?: string) {
    const existingPhone = await this.userRepo.findOneBy({ phone });
    if (existingPhone) throw new ConflictException('手机号已注册');
    const existingAccount = await this.userRepo.findOneBy({ account });
    if (existingAccount) throw new ConflictException('账号已存在');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      phone, account, passwordHash,
      nickname: nickname || `用户${phone.slice(-4)}`,
    });
    await this.userRepo.save(user);
    return this.signToken(user.id, user.account);
  }

  async loginByAccount(account: string, password: string) {
    const user = await this.userRepo.findOneBy({ account });
    if (!user) throw new UnauthorizedException('账号或密码错误');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('账号或密码错误');
    const { passwordHash, ...rest } = user;
    const { accessToken } = this.signToken(user.id, user.account, user.role);
    return { accessToken, user: rest };
  }

  async loginByPhone(phone: string, code: string) {
    if (!/^\d{6}$/.test(code)) throw new UnauthorizedException('验证码格式错误');
    let user = await this.userRepo.findOneBy({ phone });
    if (!user) {
      const passwordHash = await bcrypt.hash('123456', 10);
      user = this.userRepo.create({
        phone, account: `user_${phone}`, passwordHash,
        nickname: `用户${phone.slice(-4)}`,
      });
      await this.userRepo.save(user);
    }
    const { passwordHash, ...rest } = user;
    const { accessToken } = this.signToken(user.id, user.account, user.role);
    return { accessToken, user: rest };
  }

  private signToken(userId: string, account: string, role?: string) {
    return { accessToken: this.jwtService.sign({ sub: userId, account, role: role || "user" }) };
  }
}
