import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RegulationRequestStatus {
  PENDING = 'Pending',
  PENDING_2ND = 'Pending_2nd',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export class CreatePolicyDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  category!: string; // e.g., "Work From Home", "Equipment", "Dress Code", "General"

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean = true;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowEmployeeRequests?: boolean = true;

  @ApiPropertyOptional({ description: 'Flexible policy rules/limits' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdatePolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowEmployeeRequests?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateRequestDto {
  @ApiProperty()
  @IsUUID()
  policyId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateRequestStatusDto {
  @ApiProperty({ enum: ['Approved', 'Rejected'] })
  @IsEnum(['Approved', 'Rejected'])
  status!: 'Approved' | 'Rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class RegulationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RegulationRequestStatus })
  @IsOptional()
  @IsEnum(RegulationRequestStatus)
  status?: RegulationRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  policyId?: string;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
