import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInDto {
  @ApiProperty({ example: 'Office', enum: ['Office', 'Remote'] })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiPropertyOptional({ example: '192.168.10.45' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Chrome / macOS' })
  @IsString()
  @IsOptional()
  device?: string;

  @ApiPropertyOptional({ example: 'Regular check-in' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CheckOutDto {
  @ApiPropertyOptional({ example: 'Regular check-out' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitCorrectionDto {
  @ApiProperty({ example: '2026-06-15' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date!: string;

  @ApiProperty({ example: '09:00 AM' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2} [AP]M$/, { message: 'proposedCheckIn must be in hh:mm AM/PM format' })
  proposedCheckIn!: string;

  @ApiProperty({ example: '06:00 PM' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2} [AP]M$/, { message: 'proposedCheckOut must be in hh:mm AM/PM format' })
  proposedCheckOut!: string;

  @ApiProperty({ example: 'Forgot to check out' })
  @IsString()
  @IsNotEmpty()
  correctionReason!: string;
}

export class AdminLogOverrideDto {
  @ApiProperty({ example: 'uuid-of-employee' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date!: string;

  @ApiProperty({ example: 'present', enum: ['present', 'late', 'absent', 'leave', 'holiday', 'weekend'] })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional({ example: '09:00 AM' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2} [AP]M$/, { message: 'checkIn must be in hh:mm AM/PM format' })
  checkIn?: string;

  @ApiPropertyOptional({ example: '06:00 PM' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2} [AP]M$/, { message: 'checkOut must be in hh:mm AM/PM format' })
  checkOut?: string;

  @ApiPropertyOptional({ example: 'Manual override' })
  @IsString()
  @IsOptional()
  notes?: string;
}

