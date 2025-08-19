import { Optional } from '@nestjs/common';
import { IsDefined, IsString } from 'class-validator';

export class CreateTodoDto {
  @IsDefined()
  @IsString()
  title: string;

  @Optional()
  @IsString()
  description?: string;
}
