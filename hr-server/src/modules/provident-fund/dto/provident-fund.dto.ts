import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProvidentFundSettingsDto {
  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minServiceMonths?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employeeContributionRate?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  employerContributionRate?: number;

  @ApiPropertyOptional({ example: 'monthly' })
  @IsOptional()
  @IsString()
  contributionFrequency?: string;

  @ApiPropertyOptional({ example: 'basic_salary' })
  @IsOptional()
  @IsString()
  calculationBasis?: string;

  @ApiPropertyOptional({ example: 'As per PF Trust Rules and Labour Law' })
  @IsOptional()
  @IsString()
  withdrawalRules?: string;
}
