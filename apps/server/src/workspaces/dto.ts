import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

export class AddWorkspaceMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'])
  role?: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
}
