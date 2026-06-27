import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({ example: 'AST-MBP-001' })
  @IsString()
  @IsNotEmpty()
  assetTag!: string;

  @ApiProperty({ example: 'MacBook Pro M3 Max' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'C02XYZ123456' })
  @IsString()
  @IsNotEmpty()
  serialNumber!: string;

  @ApiProperty({ example: 'Laptop' })
  @IsString()
  @IsNotEmpty()
  category!: string; // Laptop, Mobile, Monitor, Access Card, Others

  @ApiPropertyOptional({ example: 'Apple M3 Max 16-inch' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 150000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ example: 'Allocated to core developers' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class AllocateAssetDto {
  @ApiProperty({ example: '254de427-a77d-4a76-b4ef-1b9eadd69b73' })
  @IsUUID()
  @IsNotEmpty()
  assignedToId!: string;

  @ApiPropertyOptional({ example: '2027-06-01T00:00:00.000Z' })
  @IsString()
  @IsOptional()
  returnDueDate?: string;

  @ApiPropertyOptional({ example: 'Provisioned for remote work.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAssetConditionDto {
  @ApiProperty({ example: 'Damaged' })
  @IsEnum(['New', 'Good', 'Damaged', 'Lost'])
  condition!: 'New' | 'Good' | 'Damaged' | 'Lost';

  @ApiPropertyOptional({ example: 'Screen cracked during travel.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
