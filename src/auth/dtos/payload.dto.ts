import { IsString, IsNotEmpty } from 'class-validator';

export class PayloadDto {
  @IsString()
  @IsNotEmpty()
  sub: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}
