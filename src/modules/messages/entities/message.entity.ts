import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Chat } from '@/modules/chats/entities/chat.entity';

@Entity('messages')
// TypeORM 0.3+: составной индекс через объект (order в опциях может не поддерживаться в декораторе — используем columns)
@Index(['chatId', 'createdAt'])
@Index(['senderId'])
@Index(['status'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  chatId: string;

  @Column()
  senderId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ['text', 'image', 'file'] })
  type: 'text' | 'image' | 'file';

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({
    type: 'enum',
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  })
  status: 'sent' | 'delivered' | 'read';

  @Column({ nullable: true })
  replyToId: string;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  chat: Chat;

  @ManyToOne(() => User, (user) => user.sentMessages, { onDelete: 'CASCADE' })
  sender: User;
}
