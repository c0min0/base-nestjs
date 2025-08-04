import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser as AuthUserType } from '../types/auth-user.type';

export const ReqUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: Request & { user: AuthUserType } = ctx
      .switchToHttp()
      .getRequest();

    return request.user;
  },
);
