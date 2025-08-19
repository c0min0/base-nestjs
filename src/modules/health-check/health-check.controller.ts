import { Public } from '@modules/authentication/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthCheckController {
  @Public()
  @Get('health')
  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}
