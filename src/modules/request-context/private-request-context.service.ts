import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { Permissions } from '@modules/authorisation/types/permissions.type';

@Injectable()
export class PrivateRequestContextService {
  private request: Request;
  private authorisationResourceKey: keyof Permissions;

  setRequest(req: Request) {
    this.request = req;
  }

  getRequest(): Request {
    return this.request;
  }

  setAuthorisationResourceKey(key: keyof Permissions) {
    this.authorisationResourceKey = key;
  }

  getAuthorisationResourceKey(): keyof Permissions {
    return this.authorisationResourceKey;
  }
}
