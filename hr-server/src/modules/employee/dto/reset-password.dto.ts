import { IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetEmployeePasswordDto {
  @ApiProperty({ description: 'Min 8 chars, upper+lower+number+special' })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Must contain uppercase letter' })
  @Matches(/[a-z]/, { message: 'Must contain lowercase letter' })
  @Matches(/[0-9]/, { message: 'Must contain number' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Must contain special character' })
  password!: string;
}
