import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['password'] as const),
) {
  @ApiPropertyOptional({ enum: ['admin', 'hr', 'manager', 'employee'] })
  @IsOptional()
  @IsEnum(['admin', 'hr', 'manager', 'employee'])
  role?: 'admin' | 'hr' | 'manager' | 'employee';
}

 