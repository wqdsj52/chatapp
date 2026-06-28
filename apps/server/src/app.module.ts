import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { User, Session, Message, Notification } from './entities';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: path.join(process.cwd(), 'data', 'chat.sqlite'),
      autoSave: true,
      synchronize: true,
      entities: [User, Session, Message, Notification],
    }),
    AuthModule,
    ChatModule,
    UserModule,
    NotificationModule,
    AdminModule,
  ],
})
export class AppModule {}
