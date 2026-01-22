import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(@Query('q') query: string) {
    return this.usersService.findByUsername(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() { status }: { status: 'online' | 'offline' | 'away' },
  ) {
    return this.usersService.updateStatus(id, status);
  }
}
