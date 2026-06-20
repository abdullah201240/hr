import { IsString, IsNotEmpty, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKpiDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

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
