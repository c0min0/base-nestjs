import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ReqUser } from './decorators/auth-user.decorator';
import type { AuthUser } from './types/auth-user.type';
import type { AccessTokenDto } from './dtos/access-token.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@ReqUser() user: AuthUser): AccessTokenDto {
    return this.authService.login(user);
  }
}
