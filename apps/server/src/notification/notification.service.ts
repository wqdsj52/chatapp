import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities';

@Injectable()
export class NotificationService {
  constructor(@InjectRepository(Notification) private notifRepo: Repository<Notification>) {}

  async getUserNotifications(userId: string) {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markRead(userId: string, notifId: string) {
    const notif = await this.notifRepo.findOneBy({ id: notifId, userId });
    if (!notif) return false;
    notif.read = true;
    await this.notifRepo.save(notif);
    return true;
  }

  async markAllRead(userId: string) {
    await this.notifRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ read: true })
      .where('userId = :userId AND read = false', { userId })
      .execute();
    return true;
  }
}
