import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: { phone: string; account: string; password: string; nickname?: string; userCode?: string }) {
    return this.authService.register(body.phone, body.account, body.password, body.nickname, body.userCode);
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
    return { success: true, message: '\u9a8c\u8bc1\u7801\u5df2\u53d1\u9001\uff08\u6d4b\u8bd5\u6a21\u5f0f\uff0c\u8f93\u5165\u4efb\u610f6\u4f4d\u6570\u5b57\uff09' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: any) {
    return req.user;
  }
}