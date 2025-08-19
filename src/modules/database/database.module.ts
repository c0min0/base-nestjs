import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmConfigService } from './typeorm-config-service';
import { TransactionInterceptor } from './interceptors/transaction.interceptor';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: TypeOrmConfigService,
    }),
  ],
  providers: [TransactionInterceptor],
  exports: [TransactionInterceptor],
})
export class DatabaseModule {}
