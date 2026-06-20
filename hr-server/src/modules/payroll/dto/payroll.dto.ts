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
