import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  Index,
} from 'typeorm';
import { Chat } from '@/modules/chats/entities/chat.entity';
import { ChatMember } from '@/modules/chats/entities/chat-member.entity';
import { Message } from '@/modules/messages/entities/message.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['phone'], { unique: true, where: '"phone" IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ default: 'offline' })
  status: 'online' | 'offline' | 'away';

  @Column({ nullable: true })
  lastSeen: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Chat, (chat) => chat.creator)
  createdChats: Chat[];

  @ManyToMany(() => Chat, (chat) => chat.members)
  chats: Chat[];

  @OneToMany(() => ChatMember, (member) => member.user)
  chatMemberships: ChatMember[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];
}
