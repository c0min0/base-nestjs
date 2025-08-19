import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { DataSource, type EntityManager } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    return await this.dataSource.transaction(async (manager): Promise<any> => {
      context
        .switchToHttp()
        .getRequest<Request & { manager: EntityManager }>().manager = manager;
      return await firstValueFrom(next.handle());
    });
  }
}
