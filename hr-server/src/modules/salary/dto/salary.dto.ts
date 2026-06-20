import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsIn,
  ValidateNested,
  IsDateString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Salary Template Component DTOs ─────────────────────────────────────────

export class CreateSalaryTemplateComponentDto {
  @ApiProperty({ example: 'House Rent Allowance' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'earning', enum: ['earning', 'deduction'] })
  @IsString()
  @IsIn(['earning', 'deduction'])
  type!: string;

  @ApiProperty({ example: 'percentage', enum: ['percentage', 'fixed'] })
  @IsString()
  @IsIn(['percentage', 'fixed'])
  calculationType!: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateSalaryTemplateComponentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ example: 'House Rent Allowance' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'earning', enum: ['earning', 'deduction'] })
  @IsOptional()
  @IsString()
  @IsIn(['earning', 'deduction'])
  type?: string;

  @ApiPropertyOptional({ example: 'percentage', enum: ['percentage', 'fixed'] })
  @IsOptional()
  @IsString()
  @IsIn(['percentage', 'fixed'])
  calculationType?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

// ─── Salary Template DTOs ───────────────────────────────────────────────────

export class CreateSalaryTemplateDto {
  @ApiProperty({ example: 'Standard Full-Time Package' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Standard package with HRA, Transport, Medical allowances' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [CreateSalaryTemplateComponentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalaryTemplateComponentDto)
  components?: CreateSalaryTemplateComponentDto[];
}

export class UpdateSalaryTemplateDto {
  @ApiPropertyOptional({ example: 'Standard Full-Time Package' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [UpdateSalaryTemplateComponentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSalaryTemplateComponentDto)
  components?: UpdateSalaryTemplateComponentDto[];
}

// ─── Employee Salary DTOs ───────────────────────────────────────────────────

export class AssignEmployeeSalaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  employeeId!: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ example: 65000 })
  @IsNumber()
  @Min(0)
  basicSalary!: number;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  effectiveDate!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  pfApplicable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  festivalBonusApplicable?: boolean;

  @ApiPropertyOptional({ example: 'Initial salary assignment' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEmployeeSalaryDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  templateId?: string | null;

  @ApiPropertyOptional({ example: 70000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  pfApplicable?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  festivalBonusApplicable?: boolean;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'superseded'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'superseded'])
  status?: string;

  @ApiPropertyOptional({ example: 'Salary revised after performance review' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class EmployeeSalaryQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsString()
  status?: string = 'active';
}

export class BulkSalaryRevisionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  percentageIncrease?: number;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  effectiveDate!: string;

  @ApiPropertyOptional({ example: 'Annual 10% raise' })
  @IsOptional()
  @IsString()
  notes?: string;
}
