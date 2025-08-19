import {
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type Repository } from 'typeorm';
import type { CreateUserDto } from './dtos/in/create-user.dto';
import type { UpdateUserDto } from './dtos/in/update-user.dto';
import type { UserResponseDto } from './dtos/out/user-response.dto';
import { UserMapperService } from './mappers/user-mapper.service';
import * as argon2 from 'argon2';
import { v7 as uuidv7 } from 'uuid';
import { ROLES } from '@modules/authorisation/types/roles.type';
import { ConfigService } from '@nestjs/config';
import { VAR_ENV_KEYS } from '@constants/var-env-keys';
import { RefreshTokenService } from '@modules/refresh-token/refresh-token.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly userMapperService: UserMapperService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async onModuleInit() {
    await this.handleFirstAdmin();
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find();
    return this.userMapperService.toUserResponseList(users);
  }

  async findOneById(
    id: string,
    transactionalRepository?: Repository<User>,
  ): Promise<UserResponseDto> {
    const repository = transactionalRepository ?? this.userRepository;
    const user = await repository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userMapperService.toUserResponse(user);
  }

  async create(
    createUserDto: CreateUserDto,
    transactionalRepository?: Repository<User>,
  ): Promise<UserResponseDto> {
    const repository = transactionalRepository ?? this.userRepository;

    const hashedPassword = await argon2.hash(createUserDto.password);
    const user = repository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await repository.save(user);
    return this.userMapperService.toUserResponse(savedUser);
  }

  async update(
    authUserId: string,
    updateUserDto: UpdateUserDto,
    transactionalRepository?: Repository<User>,
  ): Promise<void> {
    const updateData = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await argon2.hash(updateUserDto.password);
    }

    const repository = transactionalRepository ?? this.userRepository;

    const result = await repository.update(authUserId, updateData);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async remove(
    id: string,
    transactionalRepository?: Repository<User>,
  ): Promise<void> {
    const repository = transactionalRepository ?? this.userRepository;
    const result = await repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async revokeRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenService.revokeActiveTokensOfUser(userId);
  }

  getSampleUser(): UserResponseDto {
    return {
      id: uuidv7(),
      username: 'sample',
      email: 'sample@example.com',
      birthDate: new Date(),
      roles: [ROLES.USER],
    };
  }

  private async handleFirstAdmin() {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(User);

      const existingAdmin = await repository.findOneBy({
        username: 'admin',
      });

      if (existingAdmin) return;

      const [password, email] = [
        this.configService.get<string>(VAR_ENV_KEYS.ADMIN_PASSWORD),
        this.configService.get<string>(VAR_ENV_KEYS.ADMIN_EMAIL),
      ];

      if (!password || !email) {
        throw new Error('ADMIN credentials are not set');
      }

      const newAdmin: CreateUserDto = {
        username: 'admin',
        password,
        email,
        birthDate: new Date(),
        roles: [ROLES.ADMIN],
      };

      await this.create(newAdmin, repository);
    });
  }
}
