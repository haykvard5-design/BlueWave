import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { Chat } from './entities/chat.entity';
import { ChatMember } from './entities/chat-member.entity';
import { MessagesModule } from '@/modules/messages/messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatMember]),
    forwardRef(() => MessagesModule),
  ],
  providers: [ChatsService],
  controllers: [ChatsController],
  exports: [ChatsService],
})
export class ChatsModule {}
