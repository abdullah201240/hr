import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisburseFestivalBonusCycleDto {
  @ApiProperty({ example: 'Bank Transfer' })
  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @ApiProperty({ example: 'TXN-FB-2026-001' })
  @IsString()
  @IsNotEmpty()
  paymentRef!: string;

  @ApiProperty({ example: '2026-06-25T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  disbursementDate!: string;
}
