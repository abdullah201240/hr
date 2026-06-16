import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsOptional,
  IsArray,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveApplicationDto {
  @ApiProperty({
    example: 'd3b07384-d113-4ec5-a587-c8c5ed167384',
    description: 'Leave type ID',
  })
  @IsUUID()
  @IsNotEmpty()
  leaveTypeId!: string;

  @ApiProperty({ example: '2026-06-15', description: 'Start Date YYYY-MM-DD' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-06-17', description: 'End Date YYYY-MM-DD' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiProperty({ example: 'Family trip out of town', description: 'Reason for leave' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason!: string;

  @ApiPropertyOptional({
    example: [{ id: 'att-1', title: 'Flight Tickets', fileName: 'tickets.pdf', fileUrl: 'https://cloudinary.com/xyz.pdf' }],
    description: 'Attachments list',
  })
  @IsOptional()
  @IsArray()
  attachments?: Array<{ id: string; title: string; fileName: string; fileUrl: string }>;
}

export class UpdateLeaveApplicationStatusDto {
  @ApiProperty({ example: 'Approved', enum: ['Approved', 'Rejected'] })
  @IsEnum(['Approved', 'Rejected'])
  @IsNotEmpty()
  status!: 'Approved' | 'Rejected';

  @ApiPropertyOptional({ example: 'Insufficient documentation', description: 'Reason if rejected' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}
