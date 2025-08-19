import { ROLES, type Role } from '@modules/authorisation/types/roles.type';
import {
  IsArray,
  IsDate,
  IsDefined,
  IsEmail,
  IsEnum,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @MinLength(4)
  username: string;

  @IsDefined()
  @MinLength(6)
  password: string;

  @IsDefined()
  @Type(() => Date)
  @IsDate()
  birthDate: Date;

  @IsDefined()
  @IsArray()
  @IsEnum(ROLES, { each: true })
  roles: Role[];
}
