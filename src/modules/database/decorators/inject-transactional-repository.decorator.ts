import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import type { EntityManager } from 'typeorm';

export const InjectTransactionalRepository = createParamDecorator(
  (data: EntityClassOrSchema, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { manager: EntityManager }>();
    return request.manager.getRepository(data);
  },
);
