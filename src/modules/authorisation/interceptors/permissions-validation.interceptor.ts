import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { IS_PUBLIC_KEY } from '@modules/authentication/decorators/public.decorator';
import { PERMISSIONS_CHECKED_KEY } from '../constants/permissions-checked.const';
import type { Request } from 'express';

@Injectable()
export class PermissionsValidationInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
          IS_PUBLIC_KEY,
          [context.getHandler(), context.getClass()],
        );

        if (isPublic) return;

        const permissionsChecked = context
          .switchToHttp()
          .getRequest<Request & { [PERMISSIONS_CHECKED_KEY]: boolean }>()[
          PERMISSIONS_CHECKED_KEY
        ];

        if (!permissionsChecked) {
          throw new ForbiddenException(
            'Permissions not checked. Use @Public() or ensure permissions are validated.',
          );
        }
      }),
    );
  }
}
