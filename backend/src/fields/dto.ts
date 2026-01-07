import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { FieldType } from '@prisma/client';

export class CreateFieldDto {
  @IsString()
  tableId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(FieldType)
  type!: FieldType;

  @IsOptional()
  options?: any;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  position?: number;
}
