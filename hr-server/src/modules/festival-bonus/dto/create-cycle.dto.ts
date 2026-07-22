import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFestivalBonusCycleDto {
  @ApiProperty({ example: 'Eid-ul-Fitr 2026' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '2026-06-25T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  festivalDate!: string;
}
