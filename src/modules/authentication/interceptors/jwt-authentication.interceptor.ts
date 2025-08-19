import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Payload } from '../dtos/payload.dto';
import { AuthenticationService } from '../authentication.service';
import { getDevice } from '@utils/request.utils';
import { parseEntity } from '@utils/class-transformer.utils';
import type { AuthUser } from '../types/auth-user.type';

@Injectable()
export class JwtAuthenticationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly authService: AuthenticationService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    const token = this.getToken(request);
    const rawPayload = this.getRawPayload(token);
    const payload = await this.parsePayloadStructure(rawPayload);
    const device = getDevice(request);

    try {
      this.authService.validatePayloadDevice(payload, device);
      this.authService.validatePayloadExpiration(payload);

      request.user = this.authService.getAuthUserFromPayload(payload, device);
      return next.handle();
    } catch (e) {
      if (!(e instanceof Error)) {
        throw e;
      }

      if (e.message !== 'Token expired') {
        throw new UnauthorizedException(e.message);
      }

      const authUser = this.authService.getAuthUserFromPayload(payload, device);

      try {
        await this.authService.refreshAuthentication(
          authUser,
          request,
          context.switchToHttp().getResponse<Response>(),
        );
      } catch (e) {
        if (!(e instanceof Error)) {
          throw e;
        }
        throw new UnauthorizedException(e.message);
      }

      request.user = authUser;
      return next.handle();
    }
  }

  private getToken(request: Request): string {
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token not provided');
    }

    return authHeader.split(' ')[1];
  }

  private getRawPayload(token: string): unknown {
    try {
      return this.jwtService.verify<any>(token, {
        ignoreExpiration: true,
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async parsePayloadStructure(rawPayload: unknown): Promise<Payload> {
    try {
      return await parseEntity(Payload, rawPayload);
    } catch (e) {
      if (e instanceof Error) {
        throw new UnauthorizedException(e.message);
      }
      throw e;
    }
  }
}
