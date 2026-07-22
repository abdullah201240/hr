import { IsString, IsNotEmpty, IsNumber, Min, Max, IsArray, ValidateNested, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCycleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCycleStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string; // draft | active | completed
}

export class CreateKpiDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @IsString()
  @IsOptional()
  cycleId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  targetMetric!: string;

  @IsNumber()
  @Min(5)
  @Max(100)
  weight!: number;
}

export class SelfKpiScoreItemDto {
  @IsString()
  @IsNotEmpty()
  kpiId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  selfScore!: number;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class SubmitSelfAppraisalDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelfKpiScoreItemDto)
  scores!: SelfKpiScoreItemDto[];

  @IsString()
  @IsOptional()
  selfFeedback?: string;
}

export class ManagerKpiScoreItemDto {
  @IsString()
  @IsNotEmpty()
  kpiId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  managerScore!: number;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class SubmitManagerAppraisalDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManagerKpiScoreItemDto)
  scores!: ManagerKpiScoreItemDto[];

  @IsString()
  @IsOptional()
  managerFeedback?: string;

  @IsBoolean()
  @IsOptional()
  promotionRecommended?: boolean;

  @IsString()
  @IsOptional()
  promotionReadiness?: string; // ready_now | ready_1_2_years | not_eligible

  @IsString()
  @IsOptional()
  recommendedDesignationId?: string;

  @IsString()
  @IsOptional()
  managerNotes?: string;
}

export class KpiScoreItemDto {
  @IsString()
  @IsNotEmpty()
  kpiId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;
}

export class UpdateKpiScoresDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KpiScoreItemDto)
  scores!: KpiScoreItemDto[];
}
