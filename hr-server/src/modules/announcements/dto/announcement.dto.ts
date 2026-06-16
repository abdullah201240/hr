import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(['info', 'warning', 'event', 'policy'])
  category!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  department!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(['Published', 'Draft'])
  status!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorId?: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorName?: string;
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['info', 'warning', 'event', 'policy'])
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['Published', 'Draft'])
  status?: string;
}

export class AnnouncementQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination (base64 encoded timestamp:id)',
    example: 'MTcwMDAwMDAwMDAwMDowMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDA=',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of items to return',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['Published', 'Draft', 'all'],
    default: 'all',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Published', 'Draft', 'all'])
  status?: string = 'all';

  @ApiPropertyOptional({
    description: 'Search by title, content, or author',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export interface AnnouncementCursorPage {
  data: any[];
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
}
