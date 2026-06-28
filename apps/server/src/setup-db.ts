import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Session, Message, Notification } from './entities';
import * as bcrypt from 'bcryptjs';

async function setup() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
    synchronize: true,
    entities: [User, Session, Message, Notification],
  });

  await ds.initialize();
  console.log('Database connected');

  const userRepo = ds.getRepository(User);
  const count = await userRepo.count();
  if (count > 0) {
    console.log('Database already seeded');
    await ds.destroy();
    return;
  }

  console.log('Seeding demo data...');

  const sessionRepo = ds.getRepository(Session);
  const messageRepo = ds.getRepository(Message);
  const notifRepo = ds.getRepository(Notification);

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

  await messageRepo.save([
    messageRepo.create({ sessionId: s1.id, senderId: alice.id, content: '你好 Bob！' }),
    messageRepo.create({ sessionId: s1.id, senderId: bob.id, content: '嗨 Alice，最近怎么样？' }),
    messageRepo.create({ sessionId: s1.id, senderId: alice.id, content: '很好，正在开发聊天软件呢 🚀' }),
    messageRepo.create({ sessionId: s2.id, senderId: alice.id, content: '大家好，欢迎来到开发群！' }),
    messageRepo.create({ sessionId: s2.id, senderId: charlie.id, content: 'Hi! 我是 Charlie' }),
  ]);

  await notifRepo.save([
    notifRepo.create({ userId: alice.id, type: 'system', title: '欢迎', content: '欢迎使用聊天系统！' }),
    notifRepo.create({ userId: bob.id, type: 'system', title: '欢迎', content: '欢迎使用聊天系统！' }),
  ]);

  console.log('Demo data seeded!');
  await ds.destroy();
}

setup().catch(e => { console.error(e); process.exit(1); });
