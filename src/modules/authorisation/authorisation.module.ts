import { forwardRef, Module } from '@nestjs/common';
import { AuthorisationService } from './authorisation.service';
import { PermissionsValidationInterceptor } from './interceptors/permissions-validation.interceptor';
import { RequestContextModule } from '@modules/request-context/request-context.module';
import { UserModule } from '@modules/users/users.module';

@Module({
  imports: [RequestContextModule, forwardRef(() => UserModule)],
  providers: [AuthorisationService, PermissionsValidationInterceptor],
  exports: [AuthorisationService, PermissionsValidationInterceptor],
})
export class AuthorisationModule {}
