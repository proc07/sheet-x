import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { FieldType } from '@prisma/client';
import { Type } from 'class-transformer';

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

export class UpdateFieldLayoutItemDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsInt()
  @Min(40)
  width?: number;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}

export class UpdateFieldLayoutDto {
  @IsString()
  tableId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFieldLayoutItemDto)
  fields!: UpdateFieldLayoutItemDto[];
}
