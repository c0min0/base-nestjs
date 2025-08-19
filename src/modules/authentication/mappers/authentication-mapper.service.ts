import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../types/auth-user.type';
import type { User } from '@modules/users/entities/user.entity';
import type { Payload } from '../dtos/payload.dto';
import type { Device } from '../types/device.type';

@Injectable()
export class AuthenticationMapperService {
  fromUserToAuthUserDto(user: User, device: Device): AuthUser {
    return {
      id: user.id,
      username: user.username,
      roles: user.roles,
      device,
    };
  }

  fromPayloadDtoToAuthUserDto(
    payload: Omit<Payload, 'exp'>,
    device: Device,
  ): AuthUser {
    return {
      id: payload.sub,
      username: payload.username,
      roles: payload.roles,
      device,
    };
  }
}
