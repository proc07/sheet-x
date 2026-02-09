import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTableDto {
  @IsString()
  baseId!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsInt()
  @IsIn([1, 2, 4, 6])
  rowHeight?: number;
}
