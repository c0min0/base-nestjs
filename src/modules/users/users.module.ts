import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserMapperService } from './mappers/user-mapper.service';
import { User } from './entities/user.entity';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { AuthorisationModule } from '@modules/authorisation/authorisation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthenticationModule),
    forwardRef(() => AuthorisationModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserMapperService],
  exports: [UsersService],
})
export class UserModule {}
