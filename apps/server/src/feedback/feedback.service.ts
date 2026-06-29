import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../entities';

@Injectable()
export class FeedbackService {
  constructor(@InjectRepository(Feedback) private repo: Repository<Feedback>) {}

  async create(userId: string, data: { type: string; content: string; contact?: string }) {
    const fb = this.repo.create({ userId, type: data.type, content: data.content, contact: data.contact || '' });
    return this.repo.save(fb);
  }

  async findByUser(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
