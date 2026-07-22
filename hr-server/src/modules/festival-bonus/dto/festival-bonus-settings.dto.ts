import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFestivalBonusSettingsDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  bonusesPerYear?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minServiceMonths?: number;

  @ApiPropertyOptional({ example: 'one_month_basic' })
  @IsOptional()
  @IsString()
  amountFormula?: string;

  @ApiPropertyOptional({ example: 'basic' })
  @IsOptional()
  @IsString()
  salaryComponent?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  prorataFullServiceMonths?: number;

  @ApiPropertyOptional({
    example: [{ minMonths: 6, maxMonths: 8, percentage: 20 }],
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  tierRules?: Array<{ minMonths: number; maxMonths: number | null; percentage: number }>;

  @ApiPropertyOptional({
    example: ['Permanent'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  eligibleEmployeeTypes?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowSpecialApproval?: boolean;
}
