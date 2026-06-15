import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateLeaveTypeDto {
  @ApiProperty({
    example: 'Annual Leave',
    description: 'Leave type name (unique)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'Plane', default: 'CalendarOff' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: 'bg-sky-500', default: 'bg-sky-500' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiProperty({
    example: 14,
    description: 'Number of allocated days per year',
  })
  @IsInt()
  @Min(0)
  @Max(365)
  days!: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  requiresDocument?: boolean;

  @ApiPropertyOptional({
    example: 'Paid time off for vacation and personal rest',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '5.4.3', description: 'Policy clause reference' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  clause?: string;

  @ApiPropertyOptional({ example: true, default: false, description: 'Allow carry-forward of unused leave' })
  @IsOptional()
  @IsBoolean()
  carryForward?: boolean;

  @ApiPropertyOptional({ example: 60, description: 'Maximum carry-over days (null = unlimited / not applicable)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  maxCarryOverDays?: number;

  @ApiPropertyOptional({ example: true, default: false, description: 'Allow encashment of unused leave' })
  @IsOptional()
  @IsBoolean()
  encashment?: boolean;

  @ApiPropertyOptional({ example: 50, description: 'Encashment percentage (null = not applicable)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  @Max(100)
  encashmentPercent?: number;

  @ApiPropertyOptional({ example: false, default: false, description: 'Pro-rata calculation for new joiners' })
  @IsOptional()
  @IsBoolean()
  isProRata?: boolean;

  @ApiPropertyOptional({ example: false, default: false, description: 'Sandwich leave rule (intervening holidays count as leave)' })
  @IsOptional()
  @IsBoolean()
  sandwichRule?: boolean;

  @ApiPropertyOptional({ example: 14, description: 'Compensatory leave expiry window in days (null = no expiry)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  compLeaveExpiryDays?: number;

  @ApiPropertyOptional({ example: 'Female Employees Only', description: 'Eligibility restriction text' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  eligibility?: string;
}

export class UpdateLeaveTypeDto {
  @ApiPropertyOptional({ example: 'Annual Leave' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Plane' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: 'bg-sky-500' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  days?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requiresDocument?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '5.4.3' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  clause?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  carryForward?: boolean;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  maxCarryOverDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  encashment?: boolean;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  @Max(100)
  encashmentPercent?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isProRata?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  sandwichRule?: boolean;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  compLeaveExpiryDays?: number;

  @ApiPropertyOptional({ example: 'Female Employees Only' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  eligibility?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
