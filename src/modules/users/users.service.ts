import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findMany(ids: string[]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updateStatus(
    id: string,
    status: 'online' | 'offline' | 'away',
  ): Promise<User> {
    const user = await this.findById(id);
    user.status = status;
    if (status === 'offline') {
      user.lastSeen = new Date();
    }
    return this.usersRepository.save(user);
  }

  async findByUsername(username: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :username', { username: `%${username}%` })
      .limit(20)
      .getMany();
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findById(id);
    user.isActive = false;
    return this.usersRepository.save(user);
  }
}
