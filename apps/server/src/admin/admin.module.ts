import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, Session, Message, Notification } from '../entities';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, Session, Message, Notification])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
