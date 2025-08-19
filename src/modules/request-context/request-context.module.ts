import { Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { RequestContextInterceptor } from './request-context.interceptor';
import { PrivateRequestContextService } from './private-request-context.service';

@Module({
  providers: [
    PrivateRequestContextService,
    RequestContextService,
    RequestContextInterceptor,
  ],
  exports: [
    PrivateRequestContextService,
    RequestContextService,
    RequestContextInterceptor,
  ],
})
export class RequestContextModule {}
