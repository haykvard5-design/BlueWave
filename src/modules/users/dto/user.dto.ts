import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEnum(['online', 'offline', 'away'])
  status?: 'online' | 'offline' | 'away';
}

export class UserResponseDto {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  createdAt: Date;
}
