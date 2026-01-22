import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Message } from '@/modules/messages/entities/message.entity';
import { ChatMember } from './chat-member.entity';

@Entity('chats')
@Index(['type'])
@Index(['isArchived'])
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'enum', enum: ['private', 'group'] })
  type: 'private' | 'group';

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.createdChats)
  creator: User;

  @ManyToMany(() => User, (user) => user.chats)
  @JoinTable({
    name: 'chat_members_users',
    joinColumn: { name: 'chatId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  members: User[];

  @OneToMany(() => ChatMember, (member) => member.chat, { cascade: true })
  chatMembers: ChatMember[];

  @OneToMany(() => Message, (message) => message.chat, { cascade: true })
  messages: Message[];
}
