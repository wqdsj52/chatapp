import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  type: string; // bug, feature, other

  @Column('text')
  content: string;

  @Column({ default: '' })
  contact: string;

  @Column({ default: 'pending' })
  status: string; // pending, reviewed, resolved

  @CreateDateColumn()
  createdAt: Date;
}
