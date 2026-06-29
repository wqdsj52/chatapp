import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('friend_requests')
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fromUserId' })
  fromUser!: User;

  @Column()
  fromUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'toUserId' })
  toUser!: User;

  @Column()
  toUserId!: string;

  @Column({ default: 'pending' })
  status!: 'pending' | 'accepted' | 'rejected';

  @CreateDateColumn()
  createdAt!: Date;
}
