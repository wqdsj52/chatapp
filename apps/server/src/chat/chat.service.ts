import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, Session, Message } from '../entities';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    private dataSource: DataSource,
  ) {}

  private async getSessionMembers(sessionId: string) {
    const rows = await this.dataSource.query(
      'SELECT u.id, u.nickname, u.avatarUrl, u.account, u.userCode FROM users u INNER JOIN session_members sm ON u.id = sm.userId WHERE sm.sessionId = ?',
      [sessionId]
    );
    return rows;
  }

  async getSessions(userId: string) {
    // Get sessions where user is a member using raw query
    const sessionRows = await this.dataSource.query(
      'SELECT s.id, s.type, s.name, s.createdAt FROM sessions s INNER JOIN session_members sm ON s.id = sm.sessionId WHERE sm.userId = ?',
      [userId]
    );

    const result = await Promise.all(
      sessionRows.map(async (s: any) => {
        const members = await this.getSessionMembers(s.id);
        const lastMsg = await this.messageRepo.findOne({
          where: { sessionId: s.id },
          order: { createdAt: 'DESC' },
        });
        const otherMembers = members
          .filter((m: any) => m.id !== userId)
          .map((m: any) => ({ id: m.id, nickname: m.nickname, avatarUrl: m.avatarUrl }));
        return {
          id: s.id,
          type: s.type,
          name: s.name,
          members: members.map((m: any) => m.id),
          createdAt: s.createdAt,
          lastMessage: lastMsg
            ? { id: lastMsg.id, type: lastMsg.type, content: lastMsg.content, createdAt: lastMsg.createdAt }
            : null,
          otherMembers,
        };
      }),
    );

    result.sort((a: any, b: any) => {
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    return result;
  }

  async createSingleSession(userId: string, targetUserId: string) {
    const allSessions = await this.sessionRepo.find({
      where: { type: 'single' as any },
      relations: { members: true },
    });
    const existing = allSessions.find(
      (s) =>
        s.members.some((m) => m.id === userId) &&
        s.members.some((m) => m.id === targetUserId),
    );
    if (existing) return existing;

    const target = await this.userRepo.findOneBy({ id: targetUserId });
    if (!target) throw new NotFoundException('目标用户不存在');
    const me = await this.userRepo.findOneBy({ id: userId });

    const session = this.sessionRepo.create({ type: 'single' });
    await this.sessionRepo.save(session);
    await this.dataSource.query('INSERT INTO session_members ("sessionId", "userId") VALUES (?, ?)', [session.id, userId]);
    await this.dataSource.query('INSERT INTO session_members ("sessionId", "userId") VALUES (?, ?)', [session.id, targetUserId]);
    return session;
  }

  async createGroupSession(userId: string, memberIds: string[], name: string) {
    const allIds = [...new Set([userId, ...memberIds])];
    const session = this.sessionRepo.create({ type: 'group', name });
    await this.sessionRepo.save(session);
    for (const uid of allIds) {
      await this.dataSource.query('INSERT INTO session_members ("sessionId", "userId") VALUES (?, ?)', [session.id, uid]);
    }
    return session;
  }

  async getMessages(userId: string, sessionId: string, cursor?: string, limit = 50) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: { members: true },
    });
    if (!session) throw new NotFoundException('会话不存在');

    const members = await this.getSessionMembers(sessionId);
    if (!members.some((m: any) => m.id === userId)) throw new ForbiddenException('无权访问该会话');

    const qb = this.messageRepo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .where('msg.sessionId = :sessionId', { sessionId })
      .orderBy('msg.createdAt', 'ASC');

    if (cursor) {
      const cursorMsg = await this.messageRepo.findOneBy({ id: cursor });
      if (cursorMsg) {
        qb.andWhere('msg.createdAt < :cursorTime', { cursorTime: cursorMsg.createdAt });
      }
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
        ? { id: m.sender.id, nickname: m.sender.nickname, avatarUrl: m.sender.avatarUrl }
        : null,
    }));
  }

  async sendMessage(userId: string, sessionId: string, type: string, content: string) {
    const members = await this.getSessionMembers(sessionId);
    if (!members.some((m: any) => m.id === userId)) throw new ForbiddenException('无权发送');

    const msg = this.messageRepo.create({ sessionId, senderId: userId, type: type as any, content });
    const saved = await this.messageRepo.save(msg);
    const sender = await this.userRepo.findOneBy({ id: userId });

    return {
      id: saved.id,
      sessionId: saved.sessionId,
      senderId: saved.senderId,
      type: saved.type,
      content: saved.content,
      createdAt: saved.createdAt,
      sender: sender ? { id: sender.id, nickname: sender.nickname, avatarUrl: sender.avatarUrl } : null,
    };
  }

  async getSessionMembersPublic(sessionId: string) {
    return this.getSessionMembers(sessionId);
  }
}
