import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from './chats.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatMember } from './entities/chat-member.entity';

describe('ChatsService', () => {
  let service: ChatsService;
  let chatsRepository: Repository<Chat>;
  let chatMembersRepository: Repository<ChatMember>;

  const mockChat = {
    id: 'chat-123',
    name: 'Test Chat',
    type: 'group' as const,
    avatar: null,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    creatorId: 'user-1',
    members: [],
    messages: [],
    chatMembers: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: getRepositoryToken(Chat),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ChatMember),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatsService>(ChatsService);
    chatsRepository = module.get<Repository<Chat>>(getRepositoryToken(Chat));
    chatMembersRepository = module.get<Repository<ChatMember>>(
      getRepositoryToken(ChatMember),
    );
  });

  describe('createGroupChat', () => {
    it('should create a new group chat', async () => {
      const createGroupChatDto = {
        name: 'New Group',
        memberIds: ['user-2', 'user-3'],
      };

      jest.spyOn(chatsRepository, 'create').mockReturnValue(mockChat as any);
      jest.spyOn(chatsRepository, 'save').mockResolvedValue(mockChat as any);
      jest
        .spyOn(chatMembersRepository, 'save')
        .mockResolvedValue([{} as any]);

      const result = await service.createGroupChat(
        'user-1',
        createGroupChatDto,
      );

      expect(result).toEqual(mockChat);
      expect(result.type).toBe('group');
    });
  });

  describe('findById', () => {
    it('should find chat by id', async () => {
      jest
        .spyOn(chatsRepository, 'findOne')
        .mockResolvedValue(mockChat as any);

      const result = await service.findById('chat-123');

      expect(result).toEqual(mockChat);
      expect(result.id).toBe('chat-123');
    });

    it('should throw error if chat not found', async () => {
      jest.spyOn(chatsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        'Chat not found',
      );
    });
  });

  describe('isMember', () => {
    it('should return true if user is member', async () => {
      const mockMember = { id: 'member-1', chatId: 'chat-123', userId: 'user-1' };

      jest
        .spyOn(chatMembersRepository, 'findOne')
        .mockResolvedValue(mockMember as any);

      const result = await service.isMember('chat-123', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false if user is not member', async () => {
      jest.spyOn(chatMembersRepository, 'findOne').mockResolvedValue(null);

      const result = await service.isMember('chat-123', 'user-999');

      expect(result).toBe(false);
    });
  });
});
