import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { AuthorisationService } from '../authorisation.service';
import type { Permissions } from '../types/permissions.type';

export const CreatePermissionGuardInterceptor = (
  action: Permissions[keyof Permissions]['action'],
  data?: Permissions[keyof Permissions]['dataType'],
) => {
  @Injectable()
  class PermissionGuardInterceptor implements NestInterceptor {
    constructor(readonly authorisationService: AuthorisationService) {}

    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<any>> {
      await this.authorisationService.checkPermission(action, data);
      return next.handle();
    }
  }
  return PermissionGuardInterceptor;
};
