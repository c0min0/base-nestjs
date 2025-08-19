import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { UserModule } from './users/users.module';
import { GlobalInterceptorsModule } from './global-interceptors/global-interceptors.module';
import { TodosModule } from './todos/todos.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    GlobalInterceptorsModule,
    AuthenticationModule,
    HealthCheckModule,
    UserModule,
    TodosModule,
  ],
})
export class AppModule {}
