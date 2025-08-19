import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { JwtAuthenticationInterceptor } from '@modules/authentication/interceptors/jwt-authentication.interceptor';
import { AuthorisationModule } from '@modules/authorisation/authorisation.module';
import { PermissionsValidationInterceptor } from '@modules/authorisation/interceptors/permissions-validation.interceptor';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestContextInterceptor } from '@modules/request-context/request-context.interceptor';
import { RequestContextModule } from '@modules/request-context/request-context.module';

@Module({
  imports: [RequestContextModule, AuthenticationModule, AuthorisationModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: JwtAuthenticationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PermissionsValidationInterceptor,
    },
  ],
})
export class GlobalInterceptorsModule {}
