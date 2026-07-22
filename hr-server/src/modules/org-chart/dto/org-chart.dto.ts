import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateOrgNodeDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsNotEmpty()
  personName!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  department!: string;

  @IsString()
  @IsNotEmpty()
  grade!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  headcount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  openRoles?: number;

  @IsString()
  @IsNotEmpty()
  avatarColor!: string;
}

export class UpdateOrgNodeDto {
  @IsString()
  @IsOptional()
  personName?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  headcount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  openRoles?: number;

  @IsString()
  @IsOptional()
  avatarColor?: string;
}
