import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { ChatMember } from './entities/chat-member.entity';
import {
  CreatePrivateChatDto,
  CreateGroupChatDto,
  UpdateChatDto,
  AddMemberDto,
} from './dto/chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private chatsRepository: Repository<Chat>,
    @InjectRepository(ChatMember)
    private chatMembersRepository: Repository<ChatMember>,
  ) {}

  async createPrivateChat(
    userId: string,
    createPrivateChatDto: CreatePrivateChatDto,
  ): Promise<Chat> {
    const { recipientId } = createPrivateChatDto;

    // Check if chat already exists
    const existingChat = await this.chatsRepository
      .createQueryBuilder('chat')
      .leftJoin('chat.members', 'members')
      .where('chat.type = :type', { type: 'private' })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('chat2.id')
          .from(Chat, 'chat2')
          .leftJoin('chat2.members', 'members2')
          .where('members2.id IN (:userId, :recipientId)', { userId, recipientId })
          .groupBy('chat2.id')
          .having('COUNT(members2.id) = 2')
          .getQuery();
        return 'chat.id IN ' + subQuery;
      })
      .getOne();

    if (existingChat) {
      return existingChat;
    }

    // Create new private chat (TypeORM: creator — связь ManyToOne, передаём { id }; type — enum)
    const chat = this.chatsRepository.create({
      type: 'private' as const,
      creator: { id: userId },
      members: [{ id: userId }, { id: recipientId }],
    });

    const savedChat = await this.chatsRepository.save(chat);

    // Add members
    await this.chatMembersRepository.save([
      { chatId: savedChat.id, userId },
      { chatId: savedChat.id, userId: recipientId },
    ]);

    return savedChat;
  }

  async createGroupChat(
    userId: string,
    createGroupChatDto: CreateGroupChatDto,
  ): Promise<Chat> {
    const { name, avatar, memberIds } = createGroupChatDto;

    const chat = this.chatsRepository.create({
      type: 'group' as const,
      name,
      avatar,
      creator: { id: userId },
    });

    const savedChat = await this.chatsRepository.save(chat);

    // Add creator and other members
    const memberData = [userId, ...memberIds].map((memberId) => ({
      chatId: savedChat.id,
      userId: memberId,
    }));

    await this.chatMembersRepository.save(memberData);

    return savedChat;
  }

  async findById(id: string): Promise<Chat> {
    const chat = await this.chatsRepository.findOne({
      where: { id },
      relations: ['members', 'messages'],
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return this.chatsRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.members', 'members')
      .leftJoinAndSelect('chat.messages', 'messages')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('cm.chatId')
          .from(ChatMember, 'cm')
          .where('cm.userId = :userId', { userId })
          .getQuery();
        return 'chat.id IN ' + subQuery;
      })
      .orderBy('chat.updatedAt', 'DESC')
      .getMany();
  }

  async addMember(
    chatId: string,
    userId: string,
    addMemberDto: AddMemberDto,
  ): Promise<Chat> {
    const chat = await this.findById(chatId);

    // Verify requester is member
    const isMember = await this.isMember(chatId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    // Check if user already in chat
    const existingMember = await this.chatMembersRepository.findOne({
      where: { chatId, userId: addMemberDto.userId },
    });

    if (existingMember) {
      return chat;
    }

    // Add new member
    await this.chatMembersRepository.save({
      chatId,
      userId: addMemberDto.userId,
    });

    return this.findById(chatId);
  }

  async removeMember(
    chatId: string,
    userId: string,
    targetUserId: string,
  ): Promise<void> {
    const chat = await this.findById(chatId);

    // Check permissions
    const isMember = await this.isMember(chatId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    // Remove member
    await this.chatMembersRepository.delete({
      chatId,
      userId: targetUserId,
    });
  }

  async update(
    chatId: string,
    userId: string,
    updateChatDto: UpdateChatDto,
  ): Promise<Chat> {
    const chat = await this.findById(chatId);

    // Only group chats can be updated
    if (chat.type !== 'group') {
      throw new ForbiddenException(
        'Private chats cannot be updated',
      );
    }

    // Verify user is member
    const isMember = await this.isMember(chatId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    Object.assign(chat, updateChatDto);
    return this.chatsRepository.save(chat);
  }

  async isMember(chatId: string, userId: string): Promise<boolean> {
    const member = await this.chatMembersRepository.findOne({
      where: { chatId, userId },
    });
    return !!member;
  }

  async updateUnreadCount(
    chatId: string,
    userId: string,
    increment: boolean = true,
  ): Promise<void> {
    const member = await this.chatMembersRepository.findOne({
      where: { chatId, userId },
    });

    if (member) {
      member.unreadCount = increment
        ? member.unreadCount + 1
        : 0;
      await this.chatMembersRepository.save(member);
    }
  }

  async archive(chatId: string, userId: string): Promise<Chat> {
    const chat = await this.findById(chatId);

    const isMember = await this.isMember(chatId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    chat.isArchived = true;
    return this.chatsRepository.save(chat);
  }
}
