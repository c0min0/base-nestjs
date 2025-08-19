import { AuthenticationService } from '../authentication.service';
import {
  Injectable,
  NestInterceptor,
  CallHandler,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { getDevice } from '@utils/request.utils';
import { parseEntity } from '@utils/class-transformer.utils';
import { LoginDto } from '../dtos/login.dto';
import type { AuthUser } from '../types/auth-user.type';

@Injectable()
export class LocalAuthenticationInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthenticationService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();

    try {
      const { username, password } = await parseEntity(LoginDto, request.body);
      const device = getDevice(request);

      request.user = await this.authService.getAuthUserFromUsernameAndPassword(
        username,
        password,
        device,
      );

      return next.handle();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      throw new UnauthorizedException(error.message);
    }
  }
}
