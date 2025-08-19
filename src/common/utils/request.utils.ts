import type { Device } from '@modules/authentication/types/device.type';
import type { Request } from 'express';
import * as crypto from 'crypto';

export const cleanIp = (ip: string | undefined): string | undefined => {
  if (!ip) return undefined;
  // Remove port if exists (e.g. "192.168.1.1:12345")
  return ip.split(':')[0];
};

export const getClientIp = (request: Request) => {
  return (
    cleanIp(request.headers['x-real-ip'] as string) ||
    cleanIp(request.headers['x-forwarded-for']?.toString().split(',')[0]) ||
    cleanIp(request.socket.remoteAddress) ||
    cleanIp(request.ip) ||
    null
  );
};

export const getDevice = (request: Request): Device => {
  return {
    userAgent: request.headers['user-agent'] ?? null,
    ipAddress: getClientIp(request),
  };
};

export const getDeviceHash = (device: Device): string | null => {
  if (!device.userAgent && !device.ipAddress) {
    return null;
  }
  return crypto
    .createHash('sha256')
    .update((device.userAgent ?? '') + (device.ipAddress ?? ''))
    .digest('hex');
};

export const compareDevice = (device: Device, deviceHash: string): boolean => {
  return getDeviceHash(device) === deviceHash;
};
