import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageStatusDto } from './dto/message.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  create(@Req() req: any, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(req.user.userId, createMessageDto);
  }

  @Get('chat/:chatId')
  getByChatId(
    @Param('chatId') chatId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.messagesService.findByChatId(chatId, limit, offset);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.messagesService.findById(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateMessageStatusDto,
  ) {
    return this.messagesService.updateStatus(id, updateStatusDto);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.messagesService.markAsRead(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.messagesService.delete(id, req.user.userId);
  }

  @Get('sync/data')
  getSyncData(
    @Req() req: any,
    @Query('lastSyncTime') lastSyncTime: string,
  ) {
    const lastSync = new Date(lastSyncTime);
    return this.messagesService.getSyncData(req.user.userId, lastSync);
  }
}
