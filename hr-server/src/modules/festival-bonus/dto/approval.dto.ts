import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectPayoutDto {
  @ApiProperty({ example: 'Subordinate tenure verify failed' })
  @IsString()
  @IsNotEmpty()
  comment!: string;
}

export class AddPayoutCommentDto {
  @ApiProperty({ example: 'Tenure needs double check' })
  @IsString()
  @IsNotEmpty()
  text!: string;
}
