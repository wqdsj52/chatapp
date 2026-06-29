import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { UploadController } from './upload.controller';
import { User, FriendRequest, Notification } from '../entities';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, FriendRequest, Notification])],
  controllers: [UserController, FriendController, UploadController],
  providers: [UserService, FriendService],
  exports: [UserService, FriendService],
})
export class UserModule {}
