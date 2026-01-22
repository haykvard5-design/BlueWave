import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { OfflineQueue } from './entities/offline-queue.entity';
import { CreateMessageDto, UpdateMessageStatusDto } from './dto/message.dto';
import { ChatsService } from '@/modules/chats/chats.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(OfflineQueue)
    private offlineQueueRepository: Repository<OfflineQueue>,
    private chatsService: ChatsService,
  ) {}

  async create(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const { chatId } = createMessageDto;

    // Verify user is member of chat
    const isMember = await this.chatsService.isMember(chatId, senderId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    const message = this.messagesRepository.create({
      ...createMessageDto,
      senderId,
    });

    return this.messagesRepository.save(message);
  }

  async findById(id: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: ['sender'],
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  async findByChatId(
    chatId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { chatId, isDeleted: false },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async updateStatus(
    messageId: string,
    updateStatusDto: UpdateMessageStatusDto,
  ): Promise<Message> {
    const message = await this.findById(messageId);
    message.status = updateStatusDto.status;
    return this.messagesRepository.save(message);
  }

  async delete(messageId: string, userId: string): Promise<Message> {
    const message = await this.findById(messageId);

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    return this.messagesRepository.save(message);
  }

  async markAsRead(messageId: string): Promise<Message> {
    const message = await this.findById(messageId);
    if (message.status !== 'read') {
      message.status = 'read';
      return this.messagesRepository.save(message);
    }
    return message;
  }

  // Offline Queue Management
  async addToOfflineQueue(
    userId: string,
    createMessageDto: CreateMessageDto,
    tempId?: string,
  ): Promise<OfflineQueue> {
    const queueItem = this.offlineQueueRepository.create({
      userId,
      chatId: createMessageDto.chatId,
      content: createMessageDto.content,
      type: createMessageDto.type,
      mediaUrl: createMessageDto.mediaUrl,
      fileName: createMessageDto.fileName,
      tempId,
    });

    return this.offlineQueueRepository.save(queueItem);
  }

  async getOfflineQueue(userId: string): Promise<OfflineQueue[]> {
    return this.offlineQueueRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async removeFromOfflineQueue(queueId: string): Promise<void> {
    await this.offlineQueueRepository.delete(queueId);
  }

  async getSyncData(
    userId: string,
    lastSyncTime: Date,
  ): Promise<{ messages: Message[]; count: number }> {
    const messages = await this.messagesRepository
      .createQueryBuilder('message')
      .where('message.createdAt > :lastSync', { lastSync: lastSyncTime })
      .orderBy('message.createdAt', 'DESC')
      .take(100)
      .getMany();

    return {
      messages,
      count: messages.length,
    };
  }
}
