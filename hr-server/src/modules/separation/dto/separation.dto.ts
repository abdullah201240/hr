import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsDateString } from 'class-validator';

export class CreateSeparationDto {
  @IsString()
  @IsNotEmpty()
  employeeName!: string;

  @IsEmail()
  @IsNotEmpty()
  employeeEmail!: string;

  @IsString()
  @IsNotEmpty()
  department!: string;

  @IsDateString()
  @IsNotEmpty()
  lastWorkingDay!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateSeparationDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  clearanceIt?: boolean;

  @IsBoolean()
  @IsOptional()
  clearanceFinance?: boolean;

  @IsBoolean()
  @IsOptional()
  clearanceHr?: boolean;

  @IsBoolean()
  @IsOptional()
  clearanceManager?: boolean;

  @IsBoolean()
  @IsOptional()
  assetLaptop?: boolean;

  @IsBoolean()
  @IsOptional()
  assetAccessCard?: boolean;

  @IsBoolean()
  @IsOptional()
  assetKeys?: boolean;

  @IsBoolean()
  @IsOptional()
  assetOther?: boolean;

  @IsBoolean()
  @IsOptional()
  handoverCompleted?: boolean;
}

export class SeparationQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
