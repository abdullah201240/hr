import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsArray,
  Min,
  Max,
  MaxLength,
  Matches,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Attendance Settings DTOs ─────────────────────────────────────────────

export class UpdateAttendanceSettingsDto {
  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  startTime?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  endTime?: string;

  @ApiPropertyOptional({ example: '13:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'breakStart must be in HH:mm format' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'breakEnd must be in HH:mm format' })
  breakEnd?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  lateThreshold?: number;

  @ApiPropertyOptional({ example: 240 })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(480)
  halfDayThreshold?: number;

  @ApiPropertyOptional({
    example: ['Saturday', 'Sunday'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  weeklyHolidays?: string[];

  @ApiPropertyOptional({
    example: [
      { minMinutes: 1, maxMinutes: 30, penalty: '30 Minutes Basic Salary Deduction' }
    ],
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  lateRules?: Array<{ minMinutes: number; maxMinutes: number; penalty: string }>;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  twoStepLeaveThresholdDays?: number;

  @ApiPropertyOptional({ example: 1000.00 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  twoStepClaimThresholdAmount?: number;
}

// ─── Holiday DTOs ────────────────────────────────────────────────────────

export class CreateHolidayDto {
  @ApiProperty({ example: 'Eid al-Adha' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: '2025-06-07' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  startDate!: string;

  @ApiProperty({ example: '2025-06-10' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  endDate!: string;
}

export class UpdateHolidayDto {
  @ApiPropertyOptional({ example: 'Eid al-Adha' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '2025-06-07' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-06-10' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  endDate?: string;
}
