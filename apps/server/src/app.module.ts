import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { User, Session, Message, Notification, FriendRequest } from './entities';
import * as path from 'path';

const isProduction = !!process.env.DATABASE_URL;

@Module({
  imports: [
    TypeOrmModule.forRoot(
      isProduction
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            synchronize: true,
            entities: [User, Session, Message, Notification, FriendRequest],
          }
        : {
            type: 'sqljs',
            location: path.join(process.cwd(), 'data', 'chat.sqlite'),
            autoSave: true,
            synchronize: true,
            entities: [User, Session, Message, Notification, FriendRequest],
          },
    ),
    AuthModule,
    ChatModule,
    UserModule,
    NotificationModule,
    AdminModule,
  ],
})
export class AppModule {}
