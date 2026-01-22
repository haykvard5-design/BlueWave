import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('offline_queue')
export class OfflineQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  chatId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ['text', 'image', 'file'] })
  type: 'text' | 'image' | 'file';

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  tempId: string;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
