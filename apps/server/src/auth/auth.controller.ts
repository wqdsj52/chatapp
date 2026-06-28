import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: { phone: string; account: string; password: string; nickname?: string }) {
    return this.authService.register(body.phone, body.account, body.password, body.nickname);
  }

  @Post('login')
  login(@Body() body: { account: string; password: string }) {
    return this.authService.loginByAccount(body.account, body.password);
  }

  @Post('login/sms')
  loginBySms(@Body() body: { phone: string; code: string }) {
    return this.authService.loginByPhone(body.phone, body.code);
  }

  @Post('sms/send')
  sendSms(@Body() body: { phone: string }) {
    return { success: true, message: '验证码已发送（测试模式，输入任意6位数字）' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: any) {
    return req.user;
  }
}