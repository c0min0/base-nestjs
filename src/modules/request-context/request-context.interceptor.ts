import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { PrivateRequestContextService } from './private-request-context.service';
import type { Request } from 'express';
import { AUTHORISATION_RESOURCE_KEY } from '@modules/authorisation/decorators/authorisation-resource.decorator';
import { Reflector } from '@nestjs/core';
import type { Permissions } from '@modules/authorisation/types/permissions.type';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(
    private readonly privateContextService: PrivateRequestContextService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    this.privateContextService.setRequest(req);

    const resource = this.reflector.getAllAndOverride<keyof Permissions>(
      AUTHORISATION_RESOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    this.privateContextService.setAuthorisationResourceKey(resource);

    return next.handle();
  }
}
