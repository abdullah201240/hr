import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'JWT refresh token', required: false })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

