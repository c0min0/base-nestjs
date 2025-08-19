import { Module, forwardRef } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { AuthenticationMapperService } from './mappers/authentication-mapper.service';
import { UserModule } from '@modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { VAR_ENV_KEYS } from '@constants/var-env-keys';
import { RefreshTokenModule } from '@modules/refresh-token/refresh-token.module';
import { JwtAuthenticationInterceptor } from './interceptors/jwt-authentication.interceptor';
import { LocalAuthenticationInterceptor } from './interceptors/local-authentication.interceptor';
import { AuthorisationModule } from '@modules/authorisation/authorisation.module';

@Module({
  imports: [
    RefreshTokenModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get(VAR_ENV_KEYS.JWT_SECRET),
        signOptions: {
          expiresIn: configService.get(VAR_ENV_KEYS.JWT_EXPIRATION),
        },
      }),
      inject: [ConfigService],
    }),
    AuthorisationModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    AuthenticationMapperService,
    LocalAuthenticationInterceptor,
    JwtAuthenticationInterceptor,
  ],
  exports: [
    RefreshTokenModule,
    JwtModule,
    AuthenticationService,
    JwtAuthenticationInterceptor,
  ],
})
export class AuthenticationModule {}
