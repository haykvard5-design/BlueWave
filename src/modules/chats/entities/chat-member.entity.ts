import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Chat } from './chat.entity';

@Entity('chat_members')
@Index(['chatId', 'userId'], { unique: true })
export class ChatMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  chatId: string;

  @Column()
  userId: string;

  @Column({ default: 0 })
  unreadCount: number;

  @Column({ nullable: true })
  lastReadMessageId: string;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Chat, (chat) => chat.chatMembers, { onDelete: 'CASCADE' })
  chat: Chat;

  @ManyToOne(() => User, (user) => user.chatMemberships, { onDelete: 'CASCADE' })
  user: User;
}
