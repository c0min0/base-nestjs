import { Injectable, Scope } from '@nestjs/common';
import { PrivateRequestContextService } from './private-request-context.service';
import type { Request } from 'express';
import type { Permissions } from '@modules/authorisation/types/permissions.type';

@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  constructor(
    private readonly privateRequestContextService: PrivateRequestContextService,
  ) {}

  getRequest<
    T extends { [key: string]: any } = Record<string, never>,
  >(): Request & T {
    return this.privateRequestContextService.getRequest() as Request & T;
  }

  getAuthorisationResourceKey(): keyof Permissions {
    return this.privateRequestContextService.getAuthorisationResourceKey();
  }
}
