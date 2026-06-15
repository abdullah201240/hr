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
    example: 18,
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

  @ApiPropertyOptional({ example: 18 })
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

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
