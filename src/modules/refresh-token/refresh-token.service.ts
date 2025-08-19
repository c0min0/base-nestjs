import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, type Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import type { CreateRefreshTokenDto } from './dtos/create-refresh-token.dto';
import type { Request } from 'express';
import type { Device } from '@modules/authentication/types/device.type';
import { ConfigService } from '@nestjs/config';
import { VAR_ENV_KEYS } from '@constants/var-env-keys';
import * as ms from 'ms';

@Injectable()
export class RefreshTokenService {
  private readonly expirationTime: number;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
  ) {
    const expirationString =
      this.configService.get<ms.StringValue>(
        VAR_ENV_KEYS.JWT_REFRESH_EXPIRATION,
      ) ?? '30d';

    this.expirationTime = ms(expirationString);
  }

  async create(
    refreshTokenDto: CreateRefreshTokenDto,
    transactionalRepository?: Repository<RefreshToken>,
  ): Promise<RefreshToken> {
    const repository = transactionalRepository ?? this.refreshTokenRepository;
    const refreshToken = repository.create({
      ...refreshTokenDto,
      expiresAt: new Date(Date.now() + this.expirationTime),
    });
    return repository.save(refreshToken);
  }

  async findById(
    id: string,
    transactionalRepository?: Repository<RefreshToken>,
  ): Promise<RefreshToken | null> {
    const repository = transactionalRepository ?? this.refreshTokenRepository;
    return repository.findOneBy({ id });
  }

  async setAsUsed(
    id: string,
    transactionalRepository?: Repository<RefreshToken>,
  ): Promise<void> {
    const repository = transactionalRepository ?? this.refreshTokenRepository;
    await repository.update(id, { usedAt: new Date() });
  }

  async revokeActiveTokenOfUserAndDevice(
    userId: string,
    device: Device,
    transactionalRepository?: Repository<RefreshToken>,
  ): Promise<void> {
    const repository = transactionalRepository ?? this.refreshTokenRepository;
    const { userAgent, ipAddress } = device;
    const revokedAt = new Date();
    await repository.update(
      {
        userId,
        ...(userAgent && { userAgent }),
        ...(ipAddress && { ipAddress }),
        revokedAt: IsNull(),
        usedAt: IsNull(),
        expiresAt: MoreThan(revokedAt),
      },
      { revokedAt },
    );
  }

  async revokeActiveTokensOfUser(userId: string): Promise<void> {
    const revokedAt = new Date();
    await this.refreshTokenRepository.update(
      {
        userId,
        revokedAt: IsNull(),
        usedAt: IsNull(),
        expiresAt: MoreThan(revokedAt),
      },
      { revokedAt },
    );
  }

  async revokeById(
    id: string,
    transactionalRepository?: Repository<RefreshToken>,
  ): Promise<void> {
    const repository = transactionalRepository ?? this.refreshTokenRepository;
    const result = await repository.update(id, {
      revokedAt: new Date(),
    });
    if (result.affected === 0) {
      throw new NotFoundException('Refresh token not found');
    }
  }

  getExpirationTime(): number {
    return this.expirationTime;
  }

  getIdByRequest(request: Request): string | undefined {
    return (request.cookies as { refreshToken?: string })?.refreshToken;
  }
}
