import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateDisciplinaryCaseDto {
  @IsString()
  @IsNotEmpty()
  employeeName!: string;

  @IsEmail()
  @IsNotEmpty()
  employeeEmail!: string;

  @IsString()
  @IsNotEmpty()
  offenseType!: string;

  @IsString()
  @IsOptional()
  showCauseNotice?: string;
}

export class UpdateDisciplinaryCaseDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  employeeExplanation?: string;

  @IsString()
  @IsOptional()
  finalAction?: string;
}

export class DisciplinaryQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
