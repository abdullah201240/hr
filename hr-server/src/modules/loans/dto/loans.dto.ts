import { IsNumber, IsString, IsEnum, Min, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanRequestDto {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(1, { message: 'Loan amount must be greater than zero' })
  amount!: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(1, { message: 'Repayment term must be at least 1 month' })
  termMonths!: number;

  @ApiProperty({ example: 'Home repair / Personal loan' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class ProcessLoanRequestDto {
  @ApiProperty({ example: 'Approved' })
  @IsEnum(['Approved', 'Rejected'])
  status!: 'Approved' | 'Rejected';

  @ApiProperty({ example: 'Approved by board.' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class RecordManualPaymentDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1, { message: 'Payment amount must be greater than zero' })
  amount!: number;

  @ApiProperty({ example: 'Bank Transfer' })
  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @ApiProperty({ example: 'Paid via mobile banking transaction ID TR-9983' })
  @IsString()
  @IsOptional()
  remarks?: string;
}
