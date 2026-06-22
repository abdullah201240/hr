import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePayslipBonusDto {
  @ApiProperty({ description: 'Bonus amount' })
  @IsNumber()
  @IsNotEmpty()
  bonusAmount!: number;

  @ApiProperty({ description: 'Bonus description/reason' })
  @IsString()
  @IsOptional()
  bonusDescription?: string;
}

export class UpdatePayslipAdjustmentsDto {
  @ApiProperty({ description: 'Manual bonus amount', required: false })
  @IsNumber()
  @IsOptional()
  bonusAmount?: number;

  @ApiProperty({ description: 'Manual bonus description/reason', required: false })
  @IsString()
  @IsOptional()
  bonusDescription?: string;

  @ApiProperty({ description: 'Additional earning amount for this payroll cycle', required: false })
  @IsNumber()
  @IsOptional()
  additionalAmount?: number;

  @ApiProperty({ description: 'Additional earning description', required: false })
  @IsString()
  @IsOptional()
  additionalDescription?: string;

  @ApiProperty({ description: 'Amount to reduce/waive from generated deductions', required: false })
  @IsNumber()
  @IsOptional()
  deductionReductionAmount?: number;

  @ApiProperty({ description: 'Extra deduction amount, such as advance recovery or next-month adjustment', required: false })
  @IsNumber()
  @IsOptional()
  extraDeductionAmount?: number;

  @ApiProperty({ description: 'Deduction adjustment description', required: false })
  @IsString()
  @IsOptional()
  deductionDescription?: string;
}

export class DisburseDto {
  @ApiProperty({ description: 'Month key (e.g. 2026-06)' })
  @IsString()
  @IsNotEmpty()
  monthKey!: string;

  @ApiProperty({ description: 'Payment method (e.g. Bank Transfer)' })
  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @ApiProperty({ description: 'Payment reference ID' })
  @IsString()
  @IsNotEmpty()
  referenceId!: string;

  @ApiProperty({ description: 'Disbursement date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  disbursementDate!: string;
}
