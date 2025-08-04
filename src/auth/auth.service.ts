import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@src/users/users.service';
import type { AccessTokenDto } from './dtos/access-token.dto';
import * as argon2 from 'argon2';
import type { AuthUser } from './types/auth-user.type';
import { AuthMapperService } from './mappers/auth-mapper.service';
import type { PayloadDto } from './dtos/payload.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly authMapperService: AuthMapperService,
  ) {}

  login(user: AuthUser): AccessTokenDto {
    const payload = { username: user.username, sub: user.userId };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getAuthUserFromUsernameAndPassword(
    username: string,
    password: string,
  ): Promise<AuthUser> {
    const user = await this.usersService.getUserByUsername(username);
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    return this.authMapperService.fromUserToAuthUserDto(user);
  }

  getAuthUserFromPayload(payload: PayloadDto): AuthUser {
    return this.authMapperService.fromPayloadDtoToAuthUserDto(payload);
  }
}
