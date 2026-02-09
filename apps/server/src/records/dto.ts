import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateRecordDto {
  @IsString()
  tableId!: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class PatchRecordDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsInt()
  revision!: number;
}
