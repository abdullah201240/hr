import { IsNotEmpty, IsOptional, IsString, IsIn, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['active', 'inactive'])
  status!: 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'ISO date (YYYY-MM-DD) when the employee should become inactive. Only used when status is "inactive".',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'inactiveDate must be in YYYY-MM-DD format' })
  inactiveDate?: string;
}
