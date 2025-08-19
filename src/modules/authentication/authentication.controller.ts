import {
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { ReqUser } from './decorators/req-user.decorator';
import type { AuthUser } from './types/auth-user.type';
import { Public } from './decorators/public.decorator';
import { LocalAuthenticationInterceptor } from './interceptors/local-authentication.interceptor';
import type { Response } from 'express';
import { AuthorisationResource } from '@modules/authorisation/decorators/authorisation-resource.decorator';
import { RefreshTokenService } from '@modules/refresh-token/refresh-token.service';
import type { Request } from 'express';
import { CreatePermissionGuardInterceptor } from '@modules/authorisation/interceptors/permission-guard.interceptor';
import { ACTIONS } from '@modules/authorisation/types/actions.type';
import { DataSource } from 'typeorm';
import { AuthorisationService } from '@modules/authorisation/authorisation.service';
import { RefreshToken } from '@modules/refresh-token/entities/refresh-token.entity';

@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly authentication: AuthenticationService,
    private readonly authorisation: AuthorisationService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly dataSource: DataSource,
  ) {}

  @Public()
  @UseInterceptors(LocalAuthenticationInterceptor)
  @Post('login')
  @HttpCode(204)
  async login(
    @ReqUser() user: AuthUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authentication.setCredentials(user, response);
  }

  @AuthorisationResource('refreshTokens')
  @UseInterceptors(CreatePermissionGuardInterceptor(ACTIONS.UPDATE_SELF))
  @Post('revoke-refresh-token/self')
  @HttpCode(204)
  async revokeSelfRefreshToken(@Req() request: Request): Promise<void> {
    const refreshTokenId = this.refreshTokenService.getIdByRequest(request);
    if (!refreshTokenId) {
      throw new Error('Refresh token id not found');
    }
    await this.refreshTokenService.revokeById(refreshTokenId);
  }

  @AuthorisationResource('refreshTokens')
  @Post('revoke-refresh-token/:refreshTokenId')
  @HttpCode(204)
  async revokeRefreshToken(
    @Param('refreshTokenId') refreshTokenId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RefreshToken);
      const refreshToken = await this.refreshTokenService.findById(
        refreshTokenId,
        repository,
      );
      if (!refreshToken) {
        throw new NotFoundException('Refresh token not found');
      }

      await this.authorisation.checkPermission(ACTIONS.UPDATE, {
        userId: refreshToken.userId,
      });

      await this.refreshTokenService.revokeById(refreshTokenId, repository);
    });
  }
}
