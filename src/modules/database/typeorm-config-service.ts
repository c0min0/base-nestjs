import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ENVIRONMENTS, type Environment } from '@constants/environtments';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mariadb',
      database: this.configService.get<string>('DATABASE_NAME'),
      port: this.configService.get<number>('DATABASE_PORT'),
      host: this.configService.get<string>('DATABASE_HOST'),
      username: this.configService.get<string>('DATABASE_USER'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      synchronize:
        this.configService.get<Environment>('NODE_ENV') == ENVIRONMENTS.DEV,
      migrationsRun:
        this.configService.get<Environment>('NODE_ENV') != ENVIRONMENTS.DEV,
      migrationsTableName: 'migrations',
      migrations: [__dirname + '/../migrations/*{.ts, .js}'],
      logging:
        this.configService.get<Environment>('NODE_ENV') == ENVIRONMENTS.DEV,
    };
  }
}
