import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/in/create-user.dto';
import { UpdateUserDto } from './dtos/in/update-user.dto';
import type { UserResponseDto } from './dtos/out/user-response.dto';
import type { AuthUser } from '@modules/authentication/types/auth-user.type';
import { ReqUser } from '@modules/authentication/decorators/req-user.decorator';
import { Public } from '@modules/authentication/decorators/public.decorator';
import { CreatePermissionGuardInterceptor } from '@modules/authorisation/interceptors/permission-guard.interceptor';
import { ACTIONS } from '@modules/authorisation/types/actions.type';
import { AuthorisationResource } from '@modules/authorisation/decorators/authorisation-resource.decorator';
import { AuthorisationService } from '@modules/authorisation/authorisation.service';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';

@AuthorisationResource('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly auth: AuthorisationService,
    private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Get('sample')
  getSampleUser(): UserResponseDto {
    return this.userService.getSampleUser();
  }

  @UseInterceptors(CreatePermissionGuardInterceptor(ACTIONS.READ_SELF))
  @Get('me')
  findSelf(@ReqUser() authUser: AuthUser): Promise<UserResponseDto> {
    return this.userService.findOneById(authUser.id);
  }

  @UseInterceptors(CreatePermissionGuardInterceptor(ACTIONS.READ))
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOneById(id);
  }

  @UseInterceptors(CreatePermissionGuardInterceptor(ACTIONS.READ))
  @Get()
  findAll(): Promise<UserResponseDto[]> {
    return this.userService.findAll();
  }

  @AuthorisationResource('refreshTokens')
  @Post(':id/revoke-refresh-tokens')
  @HttpCode(204)
  async revokeRefreshTokens(@Param('id') id: string): Promise<void> {
    await this.auth.checkPermission(ACTIONS.UPDATE, {
      userId: id,
    });
    return this.userService.revokeRefreshTokens(id);
  }

  @UseInterceptors(CreatePermissionGuardInterceptor(ACTIONS.CREATE))
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  @UseInterceptors(CreatePermissionGuardInterceptor(ACTIONS.UPDATE_SELF))
  @Patch('me')
  @HttpCode(204)
  updateSelf(
    @Body() updateUserDto: UpdateUserDto,
    @ReqUser() authUser: AuthUser,
  ): Promise<void> {
    return this.userService.update(authUser.id, updateUserDto);
  }

  @Patch(':id')
  @HttpCode(204)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const user = await this.userService.findOneById(id, repository);
      await this.auth.checkPermission(ACTIONS.UPDATE, user);
      await this.userService.update(id, updateUserDto, repository);
    });
  }

  @UseInterceptors(CreatePermissionGuardInterceptor(ACTIONS.DELETE_SELF))
  @Delete('me')
  @HttpCode(204)
  removeSelf(@ReqUser() authUser: AuthUser): Promise<void> {
    return this.userService.remove(authUser.id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const user = await this.userService.findOneById(id, repository);
      await this.auth.checkPermission(ACTIONS.DELETE, user);
      await this.userService.remove(id, repository);
    });
  }
}
