import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsUUID,
  IsDefined,
  IsNumber,
} from 'class-validator';
import { ROLES, type Role } from '@modules/authorisation/types/roles.type';
import { Optional } from '@nestjs/common';

export class Payload {
  @IsDefined()
  @IsUUID(7)
  sub: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsDefined()
  @IsArray()
  @IsEnum(ROLES, { each: true })
  roles: Role[];

  @Optional()
  @IsString()
  @IsNotEmpty()
  device?: string;

  @IsDefined()
  @IsNumber()
  exp: number;
}
