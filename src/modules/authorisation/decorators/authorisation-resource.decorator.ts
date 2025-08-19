import { SetMetadata } from '@nestjs/common';
import type { Permissions } from '../types/permissions.type';

export const AUTHORISATION_RESOURCE_KEY = 'authorisationResource';
export const AuthorisationResource = (resource: keyof Permissions) =>
  SetMetadata(AUTHORISATION_RESOURCE_KEY, resource);
