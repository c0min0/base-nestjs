import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUser } from '../types/auth-user.type';
import type { Request } from 'express';

export const ReqUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: Request & { user: AuthUser } = ctx
      .switchToHttp()
      .getRequest();

    if (!request.user) {
      throw new UnauthorizedException('User not found');
    }

    return request.user;
  },
);
