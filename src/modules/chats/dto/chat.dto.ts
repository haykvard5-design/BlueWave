import { IsString, IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreatePrivateChatDto {
  @IsUUID()
  recipientId: string;
}

export class CreateGroupChatDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  memberIds: string[];
}

export class UpdateChatDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class AddMemberDto {
  @IsUUID()
  userId: string;
}

export class ChatResponseDto {
  id: string;
  name?: string;
  type: 'private' | 'group';
  avatar?: string;
  isArchived: boolean;
  createdAt: Date;
  members?: Array<{
    id: string;
    username: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
  }>;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    sender: { username: string };
  };
}
