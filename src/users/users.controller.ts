import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type { CreateUserDto } from './dtos/in/create-user.dto';
import type { UpdateUserDto } from './dtos/in/update-user.dto';
import type { UserResponseDto } from './dtos/out/user-response.dto';
import type { AuthUser } from '@auth/types/auth-user.type';
import { ReqUser } from '@auth/decorators/auth-user.decorator';
import { Public } from '@src/auth/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Public()
  @Get('sample')
  getSampleUser(): UserResponseDto {
    return this.userService.getSampleUser();
  }

  @Get('me')
  getMe(@ReqUser() user: AuthUser): Promise<UserResponseDto> {
    return this.userService.findOneById(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOneById(id);
  }

  @Get()
  findAll(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }
}
