import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  phone!: string;

  @Column({ unique: true })
  account!: string;

  @Column({ unique: true, nullable: true })
  userCode!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: '' })
  nickname!: string;

  @Column({ default: '' })
  avatarUrl!: string;

  @Column({ default: '' })
  gender!: string;

  @Column({ nullable: true })
  birthDate!: string;

  @Column({ default: '' })
  bio!: string;

  @Column({ default: '' })
  city!: string;

  @Column({ default: '' })
  province!: string;

  @Column({ default: '' })
  address!: string;

  @Column({ default: 'user' })
  role!: string;

  @ManyToMany(() => User, (user) => user.friends)
  @JoinTable({
    name: 'user_friends',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'friendId', referencedColumnName: 'id' },
  })
  friends!: User[];

  @CreateDateColumn()
  createdAt!: Date;
}
