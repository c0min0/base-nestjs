import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserResponseDto } from '../dtos/out/user-response.dto';

@Injectable()
export class UserMapperService {
  toUserResponse(user: User): UserResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }

  toUserResponseList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toUserResponse(user));
  }
}
