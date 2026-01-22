import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketGateway } from './websocket.gateway';
import { MessagesModule } from '@/modules/messages/messages.module';
import { UsersModule } from '@/modules/users/users.module';
import { ChatsModule } from '@/modules/chats/chats.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
    }),
    MessagesModule,
    UsersModule,
    ChatsModule,
  ],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
