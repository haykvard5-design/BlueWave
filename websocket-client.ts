// Example WebSocket Client Implementation
// Для использования в Android или браузере

import io, { Socket } from 'socket.io-client';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  tempId?: string;
}

interface OfflineQueueItem {
  id: string;
  userId: string;
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  tempId?: string;
}

export class MessengerWebSocketClient {
  private socket: Socket | null = null;
  private token: string = '';
  private subscriptions: Set<string> = new Set();
  private messageCallbacks: Map<string, (msg: Message) => void> = new Map();
  private statusCallbacks: Map<string, (status: any) => void> = new Map();

  constructor(
    private serverUrl: string = 'http://localhost:3000',
  ) {}

  /**
   * Подключиться к WebSocket серверу
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.token = token;

      this.socket = io(this.serverUrl, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to WebSocket');
        this.syncOfflineQueue();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebSocket');
      });

      // Listen for incoming messages
      this.socket.on('chat:*:message', (message: Message) => {
        const callback = this.messageCallbacks.get(message.chatId);
        if (callback) {
          callback(message);
        }
      });

      // Listen for message status updates
      this.socket.on('message:statusUpdated', (data: any) => {
        const callback = this.statusCallbacks.get(data.messageId);
        if (callback) {
          callback(data);
        }
      });

      // Listen for typing indicators
      this.socket.on('typing:start', (data: any) => {
        console.log(`${data.userId} is typing...`);
      });

      this.socket.on('typing:stop', (data: any) => {
        console.log(`${data.userId} stopped typing`);
      });

      // Listen for user online/offline
      this.socket.on('user-online', (data: any) => {
        console.log(`👤 ${data.userId} is online`);
      });

      this.socket.on('user-offline', (data: any) => {
        console.log(`👤 ${data.userId} is offline`);
      });

      // Listen for sync data
      this.socket.on('sync:response', (data: any) => {
        console.log('📥 Sync data received:', data.messages.length);
      });

      // Listen for offline queue items
      this.socket.on('offline-queue:items', (items: OfflineQueueItem[]) => {
        console.log('📤 Offline queue items:', items.length);
      });
    });
  }

  /**
   * Отправить сообщение
   */
  sendMessage(
    chatId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    options?: {
      mediaUrl?: string;
      fileName?: string;
      tempId?: string;
    },
  ): Promise<{ messageId: string; tempId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit(
        'message:send',
        {
          chatId,
          content,
          type,
          ...options,
        },
        (response: any) => {
          if (response.success) {
            resolve({
              messageId: response.messageId,
              tempId: options?.tempId || '',
            });
          } else {
            reject(new Error(response.error));
          }
        },
      );
    });
  }

  /**
   * Обновить статус сообщения
   */
  updateMessageStatus(
    messageId: string,
    status: 'sent' | 'delivered' | 'read',
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('message:status', { messageId, status }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Подписаться на чат (получать обновления)
   */
  subscribeToCh(chatId: string): void {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('chat:subscribe', chatId, (response: any) => {
      if (response.success) {
        this.subscriptions.add(chatId);
        console.log(`✅ Subscribed to chat ${chatId}`);
      }
    });
  }

  /**
   * Отписаться от чата
   */
  unsubscribeFromChat(chatId: string): void {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('chat:unsubscribe', chatId, (response: any) => {
      if (response.success) {
        this.subscriptions.delete(chatId);
        console.log(`✅ Unsubscribed from chat ${chatId}`);
      }
    });
  }

  /**
   * Слушать новые сообщения в чате
   */
  onMessage(chatId: string, callback: (message: Message) => void): void {
    this.messageCallbacks.set(chatId, callback);
  }

  /**
   * Слушать обновления статуса сообщения
   */
  onMessageStatusUpdated(
    messageId: string,
    callback: (status: any) => void,
  ): void {
    this.statusCallbacks.set(messageId, callback);
  }

  /**
   * Отправить уведомление о печати
   */
  startTyping(chatId: string, userId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing:start', { chatId, userId });
  }

  stopTyping(chatId: string, userId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing:stop', { chatId, userId });
  }

  /**
   * Обновить статус пользователя
   */
  setUserStatus(status: 'online' | 'offline' | 'away'): void {
    if (!this.socket) return;
    this.socket.emit('user:status', { status });
  }

  /**
   * Синхронизировать данные
   */
  requestSync(lastSyncTime: Date): void {
    if (!this.socket) return;
    this.socket.emit('sync:request', { lastSyncTime: lastSyncTime.toISOString() });
  }

  /**
   * Синхронизировать очередь оффлайн сообщений
   */
  private syncOfflineQueue(): void {
    if (!this.socket) return;
    this.socket.emit('offline-queue:sync');
  }

  /**
   * Отключиться от сервера
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Disconnected from WebSocket');
    }
  }

  /**
   * Проверить соединение
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Example Usage в Android/Kotlin:
/*
val client = MessengerWebSocketClient("http://api.yourserver.com")

// Connect
client.connect(accessToken).then {
  console.log("Connected!")
}

// Subscribe to chat
client.subscribeToCh(chatId)

// Listen for messages
client.onMessage(chatId) { message ->
  println("New message: ${message.content}")
}

// Send message
client.sendMessage(chatId, "Hello!", "text").then { response ->
  println("Message sent: ${response.messageId}")
}

// Mark as read
client.updateMessageStatus(messageId, "read")

// Typing indicator
client.startTyping(chatId, userId)
// ... user typing ...
client.stopTyping(chatId, userId)

// Change status
client.setUserStatus("away")

// Sync data
client.requestSync(Date.now() - 24*60*60*1000) // Last 24 hours
*/
