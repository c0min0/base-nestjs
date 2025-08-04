import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from '@src/users/users.module';
import { AuthModule } from '@auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ENVIRONMENTS } from '@config/environtments';
import { DatabaseModule } from '@database/database.module';
import { VARIABLE_KEYS } from '@config/variable-keys';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // GENERAL
        [VARIABLE_KEYS.NODE_ENV]: Joi.string()
          .valid(...Object.values(ENVIRONMENTS))
          .default(ENVIRONMENTS.DEV),
        [VARIABLE_KEYS.PORT]: Joi.number().empty('').default(3000),

        // JWT
        [VARIABLE_KEYS.JWT_SECRET]: Joi.when(VARIABLE_KEYS.NODE_ENV, {
          is: ENVIRONMENTS.DEV,
          then: Joi.string().empty('').default('secret'),
          otherwise: Joi.string().min(1).required(),
        }),
        [VARIABLE_KEYS.JWT_EXPIRATION]: Joi.string().empty('').default('10m'),

        // DATABASE
        [VARIABLE_KEYS.DATABASE_NAME]: Joi.string().empty('').required(),
        [VARIABLE_KEYS.DATABASE_PORT]: Joi.number().required(),
        [VARIABLE_KEYS.DATABASE_HOST]: Joi.string().empty('').required(),
        [VARIABLE_KEYS.DATABASE_USER]: Joi.string().empty('').required(),
        [VARIABLE_KEYS.DATABASE_PASSWORD]: Joi.string().empty('').required(),
      }),
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
