import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, Session, Message } from '../entities';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
  ) {}

  async getSessions(userId: string) {
    const sessions = await this.sessionRepo.find({
      where: { members: { id: userId } },
      relations: { members: true },
    });

    const result = await Promise.all(
      sessions.map(async (s) => {
        const lastMsg = await this.messageRepo.findOne({
          where: { sessionId: s.id },
          order: { createdAt: 'DESC' },
        });
        const otherMembers = s.members
          .filter((m) => m.id !== userId)
          .map((m) => ({ id: m.id, nickname: m.nickname, avatarUrl: m.avatarUrl }));
        return {
          id: s.id,
          type: s.type,
          name: s.name,
          members: s.members.map((m) => m.id),
          createdAt: s.createdAt,
          lastMessage: lastMsg
            ? { id: lastMsg.id, type: lastMsg.type, content: lastMsg.content, createdAt: lastMsg.createdAt }
            : null,
          otherMembers,
        };
      }),
    );

    result.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    return result;
  }

  async createSingleSession(userId: string, targetUserId: string) {
    // Find existing single session between two users
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
    const session = this.sessionRepo.create({ type: 'single', members: [me!, target] });
    return this.sessionRepo.save(session);
  }

  async createGroupSession(userId: string, memberIds: string[], name: string) {
    const allIds = [...new Set([userId, ...memberIds])];
    const members = await this.userRepo.find({ where: { id: In(allIds) } });
    const session = this.sessionRepo.create({ type: 'group', name, members });
    return this.sessionRepo.save(session);
  }

  async getMessages(userId: string, sessionId: string, cursor?: string, limit = 50) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: { members: true },
    });
    if (!session) throw new NotFoundException('会话不存在');
    if (!session.members.some((m) => m.id === userId)) throw new ForbiddenException('无权访问该会话');

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
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: { members: true },
    });
    if (!session) throw new NotFoundException('会话不存在');
    if (!session.members.some((m) => m.id === userId)) throw new ForbiddenException('无权发送');

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

  async getSessionMembers(sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: { members: true },
    });
    return session?.members || [];
  }
}
