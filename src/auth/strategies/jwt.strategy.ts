import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { PayloadDto } from '../dtos/payload.dto';
import type { AuthUser } from '../types/auth-user.type';
import { VARIABLE_KEYS } from '@config/variable-keys';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const secret = configService.get<string>(VARIABLE_KEYS.JWT_SECRET);

    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: unknown): Promise<AuthUser> {
    const payloadDto = plainToInstance(PayloadDto, payload);

    const errors = await validate(payloadDto);
    if (errors.length > 0) {
      throw new UnauthorizedException('Invalid JWT payload structure');
    }

    return this.authService.getAuthUserFromPayload(payloadDto);
  }
}
