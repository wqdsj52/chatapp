import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  phone!: string;

  @Column({ unique: true })
  account!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: '' })
  nickname!: string;

  @Column({ default: '' })
  avatarUrl!: string;

  @Column({ default: 'user' })
  role!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
