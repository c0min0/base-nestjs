import { ENVIRONMENTS } from '@constants/environtments';
import { VAR_ENV_KEYS } from '@constants/var-env-keys';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import * as ms from 'ms';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // GENERAL
        [VAR_ENV_KEYS.NODE_ENV]: Joi.string()
          .valid(...Object.values(ENVIRONMENTS))
          .default(ENVIRONMENTS.DEV),
        [VAR_ENV_KEYS.PORT]: Joi.number().empty('').default(3000),
        [VAR_ENV_KEYS.ADMIN_PASSWORD]: Joi.when(VAR_ENV_KEYS.NODE_ENV, {
          is: ENVIRONMENTS.DEV,
          then: Joi.string().empty('').default('admin'),
          otherwise: Joi.string().min(1).required(),
        }),
        [VAR_ENV_KEYS.ADMIN_EMAIL]: Joi.when(VAR_ENV_KEYS.NODE_ENV, {
          is: ENVIRONMENTS.DEV,
          then: Joi.string().empty('').default('admin@example.com'),
          otherwise: Joi.string().min(1).required(),
        }),

        // JWT
        [VAR_ENV_KEYS.JWT_SECRET]: Joi.when(VAR_ENV_KEYS.NODE_ENV, {
          is: ENVIRONMENTS.DEV,
          then: Joi.string().empty('').default('secret'),
          otherwise: Joi.string().min(1).required(),
        }),
        [VAR_ENV_KEYS.JWT_EXPIRATION]: Joi.string().empty('').default('10m'),
        [VAR_ENV_KEYS.JWT_REFRESH_EXPIRATION]: Joi.string()
          .empty('')
          .default('30d')
          .custom((value, helpers) => {
            const parsed = ms(value as ms.StringValue);
            if (typeof parsed !== 'number' || isNaN(parsed)) {
              return helpers.error('any.invalid');
            }
          }),

        // DATABASE
        [VAR_ENV_KEYS.DATABASE_NAME]: Joi.string().empty('').required(),
        [VAR_ENV_KEYS.DATABASE_PORT]: Joi.number().required(),
        [VAR_ENV_KEYS.DATABASE_HOST]: Joi.string().empty('').required(),
        [VAR_ENV_KEYS.DATABASE_USER]: Joi.string().empty('').required(),
        [VAR_ENV_KEYS.DATABASE_PASSWORD]: Joi.string().empty('').required(),
      }),
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
