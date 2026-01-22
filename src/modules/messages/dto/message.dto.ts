import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  chatId: string;

  @IsString()
  content: string;

  @IsEnum(['text', 'image', 'file'])
  type: 'text' | 'image' | 'file';

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @IsOptional()
  @IsString()
  tempId?: string;
}

export class UpdateMessageStatusDto {
  @IsEnum(['sent', 'delivered', 'read'])
  status: 'sent' | 'delivered' | 'read';
}

export class MessageResponseDto {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  mediaUrl?: string;
  fileName?: string;
  status: 'sent' | 'delivered' | 'read';
  replyToId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    username: string;
    avatar?: string;
  };
}
