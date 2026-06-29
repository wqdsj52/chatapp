import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
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

  console.log('Seeding demo data...');

  // 1. Create and save users
  const alice = userRepo.create({
    phone: '13800000001', account: 'alice',
    passwordHash: await bcrypt.hash('123456', 10),
    nickname: 'Alice', role: 'admin', userCode: '10000001',
  });
  const bob = userRepo.create({
    phone: '13800000002', account: 'bob',
    passwordHash: await bcrypt.hash('123456', 10),
    nickname: 'Bob', role: 'user', userCode: '10000002',
  });
  const charlie = userRepo.create({
    phone: '13800000003', account: 'charlie',
    passwordHash: await bcrypt.hash('123456', 10),
    nickname: 'Charlie', role: 'user', userCode: '10000003',
  });
  await userRepo.save(alice);
  await userRepo.save(bob);
  await userRepo.save(charlie);

  // 2. Set up friendships
  await userRepo.createQueryBuilder()
    .relation(User, 'friends')
    .of(alice.id)
    .add([bob.id, charlie.id]);
  await userRepo.createQueryBuilder()
    .relation(User, 'friends')
    .of(bob.id)
    .add([alice.id, charlie.id]);
  await userRepo.createQueryBuilder()
    .relation(User, 'friends')
    .of(charlie.id)
    .add([alice.id, bob.id]);

  // 3. Create single session and add members
  const s1 = sessionRepo.create({ type: 'single' });
  await sessionRepo.save(s1);
  await sessionRepo.createQueryBuilder()
    .relation(Session, 'members')
    .of(s1.id)
    .add([alice.id, bob.id]);

  // 4. Create group session and add members
  const s2 = sessionRepo.create({ type: 'group', name: '开发群' });
  await sessionRepo.save(s2);
  await sessionRepo.createQueryBuilder()
    .relation(Session, 'members')
    .of(s2.id)
    .add([alice.id, bob.id, charlie.id]);

  // 5. Messages
  await messageRepo.save([
    messageRepo.create({ sessionId: s1.id, senderId: alice.id, content: '你好 Bob！' }),
    messageRepo.create({ sessionId: s1.id, senderId: bob.id, content: '嗨 Alice，最近怎么样？' }),
    messageRepo.create({ sessionId: s1.id, senderId: alice.id, content: '很好，正在开发聊天软件呢 🚀' }),
    messageRepo.create({ sessionId: s2.id, senderId: alice.id, content: '大家好，欢迎来到开发群！' }),
    messageRepo.create({ sessionId: s2.id, senderId: charlie.id, content: 'Hi! 我是 Charlie' }),
  ]);

  // 6. Notifications
  await notifRepo.save([
    notifRepo.create({ userId: alice.id, type: 'system', title: '欢迎', content: '欢迎使用聊天系统！' }),
    notifRepo.create({ userId: bob.id, type: 'system', title: '欢迎', content: '欢迎使用聊天系统！' }),
    notifRepo.create({ userId: charlie.id, type: 'system', title: '欢迎', content: '欢迎使用聊天系统！' }),
  ]);

  console.log('Demo data seeded (alice/bob/charlie, password: 123456)');
}

async function bootstrap() {
  if (!process.env.DATABASE_URL) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN || true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  app.getHttpAdapter().get('/health', (req: any, res: any) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });

  const dataSource = app.get(DataSource);
  await seedDatabase(dataSource);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log('Server running on http://localhost:' + port);
}
bootstrap();
