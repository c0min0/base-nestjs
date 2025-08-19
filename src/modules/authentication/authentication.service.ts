import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@modules/users/users.service';
import type { AccessTokenResponseDto } from './dtos/access-token-response.dto';
import * as argon2 from 'argon2';
import type { AuthUser } from './types/auth-user.type';
import { AuthenticationMapperService } from './mappers/authentication-mapper.service';
import { Payload } from './dtos/payload.dto';
import type { Device } from './types/device.type';
import type { Request, Response } from 'express';
import { RefreshTokenService } from '@modules/refresh-token/refresh-token.service';
import { compareDevice, getDeviceHash } from '@utils/request.utils';
import { DataSource, type Repository } from 'typeorm';
import { RefreshToken } from '@modules/refresh-token/entities/refresh-token.entity';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly authenticationMapper: AuthenticationMapperService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly dataSource: DataSource,
  ) {}

  async setCredentials(
    user: AuthUser,
    response: Response,
    transactionalRepository?: Repository<RefreshToken>,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.getTokens(
      user,
      transactionalRepository,
    );

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: this.refreshTokenService.getExpirationTime(),
    });

    response.setHeader('Access-Token', accessToken);
  }

  private async getTokens(
    user: AuthUser,
    transactionalRepository?: Repository<RefreshToken>,
  ): Promise<AccessTokenResponseDto> {
    const payload: Omit<Payload, 'exp'> = {
      username: user.username,
      sub: user.id,
      roles: user.roles,
    };

    const { userAgent, ipAddress } = user.device;
    const deviceHash = getDeviceHash({ userAgent, ipAddress });
    if (deviceHash) {
      payload.device = deviceHash;
    }

    await this.refreshTokenService.revokeActiveTokenOfUserAndDevice(
      user.id,
      user.device,
      transactionalRepository,
    );

    const refreshTokenEntity = await this.refreshTokenService.create(
      {
        userId: user.id,
        userAgent,
        ipAddress,
      },
      transactionalRepository,
    );

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: refreshTokenEntity.id,
    };
  }

  async getAuthUserFromUsernameAndPassword(
    username: string,
    password: string,
    device: Device,
  ): Promise<AuthUser> {
    const user = await this.usersService.getUserByUsername(username);
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    return this.authenticationMapper.fromUserToAuthUserDto(user, device);
  }

  getAuthUserFromPayload(
    payload: Omit<Payload, 'exp'>,
    device: Device,
  ): AuthUser {
    return this.authenticationMapper.fromPayloadDtoToAuthUserDto(
      payload,
      device,
    );
  }

  async refreshAuthentication(
    authUser: AuthUser,
    request: Request,
    response: Response,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RefreshToken);

      const refreshTokenId = this.refreshTokenService.getIdByRequest(request);
      if (!refreshTokenId) {
        throw new Error('Refresh token id not found');
      }

      const refreshToken = await this.refreshTokenService.findById(
        refreshTokenId,
        repository,
      );
      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      // Db commands of validation logic need to be out of the transaction
      // or errors throwed will rollback any token revocation previously made
      await this.validateRefreshToken(refreshToken, authUser);

      await this.refreshTokenService.setAsUsed(refreshTokenId, repository);
      await this.setCredentials(authUser, response, repository);
    });
  }

  private async validateRefreshToken(
    refreshToken: RefreshToken,
    authUser: AuthUser,
  ): Promise<void> {
    if (refreshToken.revokedAt) {
      throw new Error('Refresh token revoked');
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    if (refreshToken.userId !== authUser.id) {
      const refreshTokenRevokedPromise =
        this.refreshTokenService.revokeActiveTokensOfUser(refreshToken.userId);
      const authUserRevokedPromise =
        this.refreshTokenService.revokeActiveTokensOfUser(authUser.id);
      await Promise.all([refreshTokenRevokedPromise, authUserRevokedPromise]);
      throw new Error('Refresh token user mismatch');
    }

    const { userAgent, ipAddress } = refreshToken;
    const tokenHashedDevice = getDeviceHash({ userAgent, ipAddress });

    if (
      tokenHashedDevice &&
      !compareDevice(authUser.device, tokenHashedDevice)
    ) {
      await this.refreshTokenService.revokeActiveTokensOfUser(authUser.id);
      throw new Error('Invalid device');
    }

    if (refreshToken.usedAt) {
      await this.refreshTokenService.revokeActiveTokensOfUser(authUser.id);
      throw new Error('Refresh token already used');
    }
  }

  validatePayloadDevice(payload: Payload, device: Device): void {
    const userDeviceHash = getDeviceHash(device);
    if (!payload.device) return;
    if (userDeviceHash !== payload.device) {
      throw new Error('Invalid device');
    }
  }

  validatePayloadExpiration(payload: Payload): void {
    if (this.isTokenExpired(payload)) {
      throw new Error('Token expired');
    }
  }

  private isTokenExpired(payload: Payload): boolean {
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }
}
