import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CrossMonthAdjustmentMetadataDto {
  @IsNumber()
  @IsOptional()
  startDay?: number;

  @IsNumber()
  @IsOptional()
  endDay?: number;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  paidDays?: number;

  @IsNumber()
  @IsOptional()
  totalDaysInMonth?: number;

  @IsNumber()
  @IsOptional()
  unpaidDays?: number;

  @IsNumber()
  @IsOptional()
  originalNetPay?: number;

  @IsString()
  @IsOptional()
  @IsIn(['dayRange', 'dateRange', 'paidDays'])
  prorationMode?: 'dayRange' | 'dateRange' | 'paidDays';
}

export class CreateSalaryAdjustmentDto {
  @ApiProperty({ description: 'Employee ID to apply adjustment for' })
  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ description: 'The month being adjusted (e.g., 2026-05)' })
  @IsString()
  @IsNotEmpty()
  targetMonthKey!: string;

  @ApiProperty({ description: 'The month this adjustment will be applied in (e.g., 2026-06)' })
  @IsString()
  @IsNotEmpty()
  appliedMonthKey!: string;

  @ApiProperty({ description: 'Type of adjustment', enum: ['addition', 'deduction', 'partial_salary'] })
  @IsString()
  @IsIn(['addition', 'deduction', 'partial_salary'])
  adjustmentType!: 'addition' | 'deduction' | 'partial_salary';

  @ApiProperty({ description: 'Adjustment amount (positive number)' })
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ description: 'Original payslip ID if adjusting a specific month', required: false })
  @IsUUID()
  @IsOptional()
  originalPayslipId?: string;

  @ApiProperty({
    description: 'Metadata for partial salary calculations',
    required: false,
    type: CrossMonthAdjustmentMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CrossMonthAdjustmentMetadataDto)
  metadata?: CrossMonthAdjustmentMetadataDto;
}

export class UpdateAdjustmentStatusDto {
  @ApiProperty({ description: 'New status', enum: ['Pending', 'Applied', 'Cancelled'] })
  @IsString()
  @IsIn(['Pending', 'Applied', 'Cancelled'])
  status!: 'Pending' | 'Applied' | 'Cancelled';
}

export class ApplyAdjustmentsToCycleDto {
  @ApiProperty({ description: 'Month key to apply pending adjustments to (e.g., 2026-06)' })
  @IsString()
  @IsNotEmpty()
  appliedMonthKey!: string;
}
