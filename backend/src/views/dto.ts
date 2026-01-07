import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ViewType } from '@prisma/client';

export class CreateViewDto {
  @IsString()
  tableId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsEnum(ViewType)
  type?: ViewType;

  @IsOptional()
  config?: any;
}
