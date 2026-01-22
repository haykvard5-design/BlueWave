import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from './entities/message.entity';
import { OfflineQueue } from './entities/offline-queue.entity';
import { ChatsModule } from '@/modules/chats/chats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, OfflineQueue]),
    forwardRef(() => ChatsModule),
  ],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
