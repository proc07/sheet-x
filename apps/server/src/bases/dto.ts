import { IsString, MinLength } from 'class-validator';

export class CreateBaseDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  workspaceId!: string;
}
