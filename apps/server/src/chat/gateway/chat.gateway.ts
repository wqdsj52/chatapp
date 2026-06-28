import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Session, Message, Notification } from '../../entities';
import { ChatService } from '../chat.service';

interface AuthedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({ cors: { origin: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      if (!this.onlineUsers.has(payload.sub)) this.onlineUsers.set(payload.sub, new Set());
      this.onlineUsers.get(payload.sub)!.add(client.id);

      // Join all session rooms
      const sessions = await this.sessionRepo
        .createQueryBuilder('s')
        .leftJoin('s.members', 'm')
        .where('m.id = :userId', { userId: payload.sub })
        .getMany();
      sessions.forEach((s) => client.join(`session:${s.id}`));

      this.server.emit('user:online', { userId: payload.sub });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthedSocket) {
    if (client.userId) {
      const sockets = this.onlineUsers.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(client.userId);
          this.server.emit('user:offline', { userId: client.userId });
        }
      }
    }
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { sessionId: string; type: string; content: string },
  ) {
    if (!client.userId) return;

    const session = await this.sessionRepo.findOne({
      where: { id: data.sessionId },
      relations: { members: true },
    });
    if (!session || !session.members.some((m) => m.id === client.userId)) return;

    const msg = this.messageRepo.create({
      sessionId: data.sessionId,
      senderId: client.userId,
      type: data.type as any,
      content: data.content,
    });
    const saved = await this.messageRepo.save(msg);
    const sender = await this.userRepo.findOneBy({ id: client.userId });

    const payload = {
      id: saved.id,
      sessionId: saved.sessionId,
      senderId: saved.senderId,
      type: saved.type,
      content: saved.content,
      createdAt: saved.createdAt,
      sender: sender ? { id: sender.id, nickname: sender.nickname, avatarUrl: sender.avatarUrl } : null,
    };

    this.server.to(`session:${data.sessionId}`).emit('message:new', payload);

    // Notify offline members
    for (const member of session.members) {
      if (member.id === client.userId) continue;
      if (!this.onlineUsers.has(member.id)) {
        const notif = this.notifRepo.create({
          userId: member.id,
          type: 'message',
          title: '新消息',
          content: `${sender?.nickname || '用户'}: ${data.content}`,
        });
        await this.notifRepo.save(notif);
      }
    }

    return payload;
  }

  @SubscribeMessage('session:join')
  handleJoinSession(@ConnectedSocket() client: AuthedSocket, @MessageBody() data: { sessionId: string }) {
    if (client.userId) client.join(`session:${data.sessionId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: AuthedSocket, @MessageBody() data: { sessionId: string }) {
    if (client.userId) {
      client.to(`session:${data.sessionId}`).emit('typing', { userId: client.userId, sessionId: data.sessionId });
    }
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}

