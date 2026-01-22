import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Chat } from '@/modules/chats/entities/chat.entity';
import { ChatMember } from '@/modules/chats/entities/chat-member.entity';
import { Message } from '@/modules/messages/entities/message.entity';
import { OfflineQueue } from '@/modules/messages/entities/offline-queue.entity';

export class DatabaseConfig {
  static getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'bluewave_messenger',
      entities: [User, Chat, ChatMember, Message, OfflineQueue],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      extra: {
        max: 20,
      },
    };
  }
}
