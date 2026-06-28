import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: 'single' | 'group';

  @Column({ nullable: true })
  name?: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'session_members',
    joinColumn: { name: 'sessionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  members!: User[];

  @OneToMany(() => Message, (m) => m.session)
  messages!: Message[];

  @CreateDateColumn()
  createdAt!: Date;
}
