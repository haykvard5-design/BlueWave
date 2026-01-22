import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '@/modules/messages/messages.service';
import { UsersService } from '@/modules/users/users.service';
import { ChatsService } from '@/modules/chats/chats.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('WebsocketGateway');
  private userConnections: Map<string, string> = new Map(); // userId -> socketId
  private socketConnections: Map<string, string> = new Map(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private messagesService: MessagesService,
    private usersService: UsersService,
    private chatsService: ChatsService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const decoded: any = this.jwtService.verify(token);
      const userId = decoded.sub;

      this.userConnections.set(userId, client.id);
      this.socketConnections.set(client.id, userId);

      // Update user status to online
      await this.usersService.updateStatus(userId, 'online');

      // Notify others that user is online
      this.server.emit('user-online', { userId, status: 'online' });

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error('Connection error:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.socketConnections.get(client.id);
    if (userId) {
      this.userConnections.delete(userId);
      this.socketConnections.delete(client.id);

      // Update user status to offline
      await this.usersService.updateStatus(userId, 'offline');

      // Notify others that user is offline
      this.server.emit('user-offline', { userId, status: 'offline' });

      this.logger.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    client: Socket,
    payload: {
      chatId: string;
      content: string;
      type: 'text' | 'image' | 'file';
      mediaUrl?: string;
      fileName?: string;
      tempId?: string;
    },
  ) {
    try {
      const userId = this.socketConnections.get(client.id);
      if (!userId) return;

      // Create message in database
      const message = await this.messagesService.create(userId, {
        chatId: payload.chatId,
        content: payload.content,
        type: payload.type,
        mediaUrl: payload.mediaUrl,
        fileName: payload.fileName,
      });

      // Broadcast to all chat members
      this.server.emit(`chat:${payload.chatId}:message`, {
        ...message,
        tempId: payload.tempId, // Echo back temp ID for client sync
      });

      return {
        success: true,
        messageId: message.id,
        tempId: payload.tempId,
      };
    } catch (error) {
      this.logger.error('Send message error:', error.message);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:status')
  async handleMessageStatus(
    client: Socket,
    payload: { messageId: string; status: 'sent' | 'delivered' | 'read' },
  ) {
    try {
      const message = await this.messagesService.updateStatus(payload.messageId, {
        status: payload.status,
      });

      // Broadcast status update
      this.server.emit('message:statusUpdated', {
        messageId: message.id,
        status: message.status,
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Status update error:', error.message);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('chat:subscribe')
  handleChatSubscribe(client: Socket, chatId: string) {
    try {
      client.join(`chat:${chatId}`);
      this.logger.log(`Client ${client.id} subscribed to chat ${chatId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Subscribe error:', error.message);
      return { success: false };
    }
  }

  @SubscribeMessage('chat:unsubscribe')
  handleChatUnsubscribe(client: Socket, chatId: string) {
    try {
      client.leave(`chat:${chatId}`);
      this.logger.log(`Client ${client.id} unsubscribed from chat ${chatId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Unsubscribe error:', error.message);
      return { success: false };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    client: Socket,
    payload: { chatId: string; userId: string },
  ) {
    this.server
      .to(`chat:${payload.chatId}`)
      .emit('typing:start', { userId: payload.userId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    client: Socket,
    payload: { chatId: string; userId: string },
  ) {
    this.server
      .to(`chat:${payload.chatId}`)
      .emit('typing:stop', { userId: payload.userId });
  }

  @SubscribeMessage('user:status')
  handleUserStatus(
    client: Socket,
    payload: { status: 'online' | 'offline' | 'away' },
  ) {
    const userId = this.socketConnections.get(client.id);
    if (userId) {
      this.server.emit('user:statusChanged', {
        userId,
        status: payload.status,
      });
    }
  }

  @SubscribeMessage('sync:request')
  async handleSyncRequest(
    client: Socket,
    payload: { lastSyncTime: string },
  ) {
    try {
      const userId = this.socketConnections.get(client.id);
      if (!userId) return;

      const syncData = await this.messagesService.getSyncData(
        userId,
        new Date(payload.lastSyncTime),
      );

      client.emit('sync:response', syncData);
    } catch (error) {
      this.logger.error('Sync error:', error.message);
      client.emit('sync:error', { error: error.message });
    }
  }

  @SubscribeMessage('offline-queue:sync')
  async handleOfflineQueueSync(client: Socket) {
    try {
      const userId = this.socketConnections.get(client.id);
      if (!userId) return;

      const queueItems = await this.messagesService.getOfflineQueue(userId);

      client.emit('offline-queue:items', queueItems);
    } catch (error) {
      this.logger.error('Offline queue sync error:', error.message);
    }
  }

  // Helper methods
  notifyUserOnline(userId: string) {
    this.server.emit('user-online', { userId, status: 'online' });
  }

  notifyUserOffline(userId: string) {
    this.server.emit('user-offline', { userId, status: 'offline' });
  }

  notifyMessageInChat(
    chatId: string,
    message: any,
  ) {
    this.server.to(`chat:${chatId}`).emit('message:new', message);
  }

  isUserOnline(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  getUserSocket(userId: string): string | undefined {
    return this.userConnections.get(userId);
  }
}
