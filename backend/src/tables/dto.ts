import { IsString, MinLength } from 'class-validator';

export class CreateTableDto {
  @IsString()
  baseId!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

export class UpdateTableDto {
  @IsString()
  @MinLength(1)
  name!: string;
}
