import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../types/auth-user.type';
import type { User } from '@src/users/entities/user.entity';
import type { PayloadDto } from '../dtos/payload.dto';

@Injectable()
export class AuthMapperService {
  fromUserToAuthUserDto(user: User): AuthUser {
    return { userId: user.id, username: user.username };
  }

  fromPayloadDtoToAuthUserDto(payload: PayloadDto): AuthUser {
    return { userId: payload.sub, username: payload.username };
  }
}
