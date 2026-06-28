import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User, Session, Message, Notification } from './entities';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

async function seedDatabase(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const sessionRepo = dataSource.getRepository(Session);
  const messageRepo = dataSource.getRepository(Message);
  const notifRepo = dataSource.getRepository(Notification);

  const count = await userRepo.count();
  if (count > 0) return;

  console.log('⏳ Seeding demo data...');

  const alice = userRepo.create({
    phone: '13800000001', account: 'alice',
    passwordHash: await bcrypt.hash('123456', 10),
    nickname: 'Alice', role: 'admin',
  });
  const bob = userRepo.create({
    phone: '13800000002', account: 'bob',
    passwordHash: await bcrypt.hash('123456', 10),
    nickname: 'Bob', role: 'user',
  });
  const charlie = userRepo.create({
    phone: '13800000003', account: 'charlie',
    passwordHash: await bcrypt.hash('123456', 10),
    nickname: 'Charlie', role: 'user',
  });
  await userRepo.save([alice, bob, charlie]);

  const s1 = sessionRepo.create({ type: 'single', members: [alice, bob] });
  await sessionRepo.save(s1);

  const s2 = sessionRepo.create({ type: 'group', name: '开发群', members: [alice, bob, charlie] });
  await sessionRepo.save(s2);

  const msgs = [
    messageRepo.create({ sessionId: s1.id, senderId: alice.id, content: '你好 Bob！' }),
    messageRepo.create({ sessionId: s1.id, senderId: bob.id, content: '嗨 Alice，最近怎么样？' }),
    messageRepo.create({ sessionId: s1.id, senderId: alice.id, content: '很好，正在开发聊天软件呢 🚀' }),
    messageRepo.create({ sessionId: s2.id, senderId: alice.id, content: '大家好，欢迎来到开发群！' }),
    messageRepo.create({ sessionId: s2.id, senderId: charlie.id, content: 'Hi! 我是 Charlie' }),
  ];
  await messageRepo.save(msgs);

  const notifs = [
    notifRepo.create({ userId: alice.id, type: 'system', title: '欢迎', content: '欢迎使用聊天系统！' }),
    notifRepo.create({ userId: bob.id, type: 'system', title: '欢迎', content: '欢迎使用聊天系统！' }),
  ];
  await notifRepo.save(notifs);

  console.log('✅ Demo data seeded (alice/bob/charlie, password: 123456)');
}

async function bootstrap() {
  // Only create data dir for SQLite (local dev)
  if (!process.env.DATABASE_URL) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const dataSource = app.get(DataSource);
  await seedDatabase(dataSource);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`?? Server running on http://localhost:${port}`);
}
bootstrap();
