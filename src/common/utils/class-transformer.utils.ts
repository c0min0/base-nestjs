import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export const parseEntity = async <T extends object>(
  entity: new () => T,
  data: unknown,
): Promise<T> => {
  const entityInstance = plainToInstance(entity, data);
  const errors = await validate(entityInstance);
  if (errors.length > 0) {
    throw new Error(`Invalid ${entity.name} structure: ${errors.join(', ')}`);
  }
  return entityInstance;
};
