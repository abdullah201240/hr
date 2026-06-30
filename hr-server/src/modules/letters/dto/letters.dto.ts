import { IsString, IsNotEmpty, IsUUID, IsDateString, IsOptional, IsEnum, IsObject, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateLetterDto {
  @ApiProperty({ description: 'Letter type (e.g. offer, appointment)' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ description: 'Target employee UUID', required: false })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ description: 'Custom Employee Name', required: false })
  @IsString()
  @IsOptional()
  employeeName?: string;

  @ApiProperty({ description: 'Custom Employee Email', required: false })
  @IsString()
  @IsOptional()
  employeeEmail?: string;

  @ApiProperty({ description: 'Subject line' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ description: 'Date of issue (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  issueDate!: string;

  @ApiProperty({ description: 'Effective date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  effectiveDate!: string;

  @ApiProperty({ description: 'Full compilation text of the letter' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiProperty({ description: 'Dynamic fields used in template' })
  @IsObject()
  @IsOptional()
  fields?: Record<string, string>;

  @ApiProperty({ description: 'Status of the letter', enum: ['Draft', 'Sent', 'Signed', 'Archived'] })
  @IsEnum(['Draft', 'Sent', 'Signed', 'Archived'])
  @IsOptional()
  status?: 'Draft' | 'Sent' | 'Signed' | 'Archived';
}

export class UpdateLetterStatusDto {
  @ApiProperty({ description: 'New status', enum: ['Draft', 'Sent', 'Signed', 'Archived'] })
  @IsEnum(['Draft', 'Sent', 'Signed', 'Archived'])
  @IsNotEmpty()
  status!: 'Draft' | 'Sent' | 'Signed' | 'Archived';
}

export class LetterQueryDto {
  @ApiProperty({ description: 'Search term for employee name or subject', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ description: 'Filter by letter type', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Filter by status', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Pagination page number', default: 1, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Pagination limit', default: 20, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
