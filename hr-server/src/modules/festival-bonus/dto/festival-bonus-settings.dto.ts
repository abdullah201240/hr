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
