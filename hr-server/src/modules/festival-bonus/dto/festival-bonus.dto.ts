import { IsNumber, IsBoolean, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFestivalBonusRuleDto {
  @ApiProperty({ example: 6 })
  @IsNumber()
  @Min(0)
  minServiceMonths!: number;

  @ApiProperty({ example: 120 })
  @IsNumber()
  @Min(0)
  maxServiceMonths!: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  bonusPercentage!: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isProRata?: boolean;

  @ApiPropertyOptional({ example: 'One Month Basic Salary' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFestivalBonusRuleDto {
  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minServiceMonths?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxServiceMonths?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonusPercentage?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isProRata?: boolean;

  @ApiPropertyOptional({ example: 'One Month Basic Salary' })
  @IsOptional()
  @IsString()
  description?: string;
}
