import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import {
  CreatePrivateChatDto,
  CreateGroupChatDto,
  UpdateChatDto,
  AddMemberDto,
} from './dto/chat.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post('private')
  createPrivateChat(
    @Req() req: any,
    @Body() createPrivateChatDto: CreatePrivateChatDto,
  ) {
    return this.chatsService.createPrivateChat(
      req.user.userId,
      createPrivateChatDto,
    );
  }

  @Post('group')
  createGroupChat(
    @Req() req: any,
    @Body() createGroupChatDto: CreateGroupChatDto,
  ) {
    return this.chatsService.createGroupChat(
      req.user.userId,
      createGroupChatDto,
    );
  }

  @Get()
  getUserChats(@Req() req: any) {
    return this.chatsService.getUserChats(req.user.userId);
  }

  @Get(':id')
  getChat(@Param('id') id: string) {
    return this.chatsService.findById(id);
  }

  @Put(':id')
  updateChat(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatsService.update(id, req.user.userId, updateChatDto);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Req() req: any,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.chatsService.addMember(id, req.user.userId, addMemberDto);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: any,
  ) {
    return this.chatsService.removeMember(id, req.user.userId, memberId);
  }

  @Put(':id/archive')
  archive(@Param('id') id: string, @Req() req: any) {
    return this.chatsService.archive(id, req.user.userId);
  }
}
