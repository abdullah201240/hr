import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CalculateSettlementDto {
  @IsString()
  @IsNotEmpty()
  separationType!: string;

  @IsNumber()
  @IsNotEmpty()
  payableDays!: number;

  @IsNumber()
  @IsNotEmpty()
  encashableAlDays!: number;

  @IsNumber()
  @IsOptional()
  pfInterest?: number;

  @IsNumber()
  @IsOptional()
  medicalReimbursement?: number;

  @IsNumber()
  @IsOptional()
  wellnessAllowance?: number;

  @IsNumber()
  @IsOptional()
  otherReimbursements?: number;

  @IsNumber()
  @IsOptional()
  salaryAdvanceRecovery?: number;

  @IsNumber()
  @IsOptional()
  loanRecovery?: number;

  @IsNumber()
  @IsOptional()
  noticePayRecovery?: number;

  @IsNumber()
  @IsOptional()
  assetRecovery?: number;

  @IsNumber()
  @IsOptional()
  taxAdjustment?: number;

  @IsNumber()
  @IsOptional()
  otherCompanyDues?: number;
}

export class UpdateSettlementStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsOptional()
  paymentDetails?: string;
}
