import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { User, Session, Message, Notification } from '../entities';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async getStats() {
    const totalUsers = await this.userRepo.count();
    const totalSessions = await this.sessionRepo.count();
    const totalMessages = await this.messageRepo.count();
    const groupSessions = await this.sessionRepo.count({ where: { type: 'group' as any } });
    const singleSessions = totalSessions - groupSessions;

    const now = new Date();
    const dailyMessages: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const result = await this.messageRepo.query(
        `SELECT COUNT(*) as count FROM messages WHERE date(createdAt) = ?`,
        [dateStr],
      );
      dailyMessages.push({ date: dateStr, count: Number(result[0]?.count || 0) });
    }

    const recentUsers = await this.userRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      totalUsers, totalSessions, totalMessages, groupSessions, singleSessions, dailyMessages,
      recentUsers: recentUsers.map((u) => ({
        id: u.id, nickname: u.nickname, account: u.account, phone: u.phone, createdAt: u.createdAt,
      })),
    };
  }

  async getUsers(keyword?: string) {
    let users: User[];
    if (keyword) {
      users = await this.userRepo.find({
        where: [
          { nickname: Like(`%${keyword}%`) },
          { account: Like(`%${keyword}%`) },
          { phone: Like(`%${keyword}%`) },
        ],
        order: { createdAt: 'DESC' },
      });
    } else {
      users = await this.userRepo.find({ order: { createdAt: 'DESC' } });
    }

    return Promise.all(
      users.map(async ({ passwordHash, ...rest }) => {
        const sessions = await this.sessionRepo.find({
          where: { members: { id: rest.id } },
        });
        const sessionIds = sessions.map((s) => s.id);
        let messageCount = 0;
        if (sessionIds.length > 0) {
          messageCount = await this.messageRepo.count({
            where: { sessionId: In(sessionIds) },
          });
        }
        return { ...rest, sessionCount: sessions.length, messageCount };
      }),
    );
  }

  async getUserDetail(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...rest } = user;

    const sessions = await this.sessionRepo.find({
      where: { members: { id: userId } },
      relations: { members: true },
    });

    const sessionDetails = await Promise.all(
      sessions.map(async (s) => {
        const messageCount = await this.messageRepo.count({ where: { sessionId: s.id } });
        return {
          id: s.id,
          type: s.type,
          name: s.name,
          memberCount: s.members.length,
          messageCount,
        };
      }),
    );

    const notifications = await this.notifRepo.find({ where: { userId } });

    return {
      ...rest,
      sessions: sessionDetails,
      notificationCount: notifications.length,
      unreadNotifications: notifications.filter((n) => !n.read).length,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.remove(user);
    return { success: true };
  }

  async getSessions(keyword?: string) {
    let sessions: Session[];
    if (keyword) {
      sessions = await this.sessionRepo
        .createQueryBuilder('s')
        .leftJoinAndSelect('s.members', 'm')
        .where('s.name LIKE :kw', { kw: `%${keyword}%` })
        .orWhere('m.nickname LIKE :kw', { kw: `%${keyword}%` })
        .getMany();
    } else {
      sessions = await this.sessionRepo.find({ relations: { members: true } });
    }

    return Promise.all(
      sessions.map(async (s) => {
        const messageCount = await this.messageRepo.count({ where: { sessionId: s.id } });
        const lastMessage = await this.messageRepo.findOne({
          where: { sessionId: s.id },
          order: { createdAt: 'DESC' },
        });
        return {
          id: s.id,
          type: s.type,
          name: s.name,
          createdAt: s.createdAt,
          members: s.members.map((m) => ({ id: m.id, nickname: m.nickname, account: m.account })),
          messageCount,
          lastMessage: lastMessage
            ? { id: lastMessage.id, content: lastMessage.content, createdAt: lastMessage.createdAt }
            : null,
        };
      }),
    );
  }

  async deleteSession(sessionId: string) {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Session not found');
    await this.messageRepo.delete({ sessionId });
    await this.sessionRepo.remove(session);
    return { success: true };
  }

  async getMessages(sessionId: string, keyword?: string) {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Session not found');

    const qb = this.messageRepo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .where('msg.sessionId = :sessionId', { sessionId })
      .orderBy('msg.createdAt', 'ASC');

    if (keyword) {
      qb.andWhere('msg.content LIKE :kw', { kw: `%${keyword}%` });
    }

    const messages = await qb.getMany();
    return messages.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      senderId: m.senderId,
      type: m.type,
      content: m.content,
      createdAt: m.createdAt,
      sender: m.sender
        ? { id: m.sender.id, nickname: m.sender.nickname, account: m.sender.account }
        : null,
    }));
  }

  async deleteMessage(sessionId: string, messageId: string) {
    const msg = await this.messageRepo.findOneBy({ id: messageId, sessionId });
    if (!msg) throw new NotFoundException('Message not found');
    await this.messageRepo.remove(msg);
    return { success: true };
  }
}
