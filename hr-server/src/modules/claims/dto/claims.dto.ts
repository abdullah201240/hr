import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Claim Type Enum ─────────────────────────────────────────────────────────

export enum ClaimType {
  MEDICAL_REIMBURSEMENT = 'medical_reimbursement',
  TADA = 'tada',
  TRAVEL_ADVANCE = 'travel_advance',
}

export enum ClaimStatus {
  PENDING = 'Pending',
  PENDING_2ND = 'Pending_2nd',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  SETTLED = 'Settled',
}

// ─── Attachment DTO ──────────────────────────────────────────────────────────

export class ClaimAttachmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty()
  @IsString()
  fileUrl!: string;
}

// ─── Create Claim DTO ────────────────────────────────────────────────────────

export class CreateClaimDto {
  @ApiProperty({ enum: ClaimType })
  @IsEnum(ClaimType)
  claimType!: ClaimType;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Type-specific JSON details' })
  @IsOptional()
  details?: Record<string, any>;

  @ApiPropertyOptional({ type: [ClaimAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimAttachmentDto)
  attachments?: ClaimAttachmentDto[];
}

// ─── Update Claim Status DTO ─────────────────────────────────────────────────

export class UpdateClaimStatusDto {
  @ApiProperty({ enum: ['Approved', 'Rejected', 'Settled'] })
  @IsEnum(['Approved', 'Rejected', 'Settled'])
  status!: 'Approved' | 'Rejected' | 'Settled';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Approved amount (for travel advance)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  approvedAmount?: number;
}

// ─── Claim Query DTO ─────────────────────────────────────────────────────────

export class ClaimQueryDto {
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

  @ApiPropertyOptional({ description: 'Search by employee name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ClaimStatus })
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @ApiPropertyOptional({ enum: ClaimType })
  @IsOptional()
  @IsEnum(ClaimType)
  claimType?: ClaimType;

  @ApiPropertyOptional({ description: 'Filter by employee ID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
