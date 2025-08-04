import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { CreateUserDto } from './dtos/in/create-user.dto';
import type { UpdateUserDto } from './dtos/in/update-user.dto';
import type { UserResponseDto } from './dtos/out/user-response.dto';
import { UserMapperService } from './mappers/user-mapper.service';
import * as argon2 from 'argon2';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userMapperService: UserMapperService,
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find();
    return this.userMapperService.toUserResponseList(users);
  }

  async findOneById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userMapperService.toUserResponse(user);
  }

  async findOneByUsername(username: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userMapperService.toUserResponse(user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const hashedPassword = await argon2.hash(createUserDto.password);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    return this.userMapperService.toUserResponse(savedUser);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<void> {
    const updateData = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await argon2.hash(updateUserDto.password);
    }

    const result = await this.userRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  getSampleUser(): UserResponseDto {
    return {
      id: uuidv7(),
      username: 'sample',
      email: 'sample@example.com',
      birthDate: new Date(),
    };
  }
}
