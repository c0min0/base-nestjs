import type { Role } from '@modules/authorisation/types/roles.type';
import type { Device } from './device.type';

export type AuthUser = {
  id: string;
  username: string;
  roles: Role[];
  device: Device;
};
