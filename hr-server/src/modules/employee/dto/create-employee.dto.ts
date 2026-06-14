import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Matches,
  MinLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Nested DTOs ────────────────────────────────────────────────────────────

export class SpouseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marriageDate?: string;
}

export class ChildDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;
}

export class NomineeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nidNumber?: string;

  @ApiPropertyOptional({ description: 'Cloudinary URL after upload' })
  @IsOptional()
  @IsString()
  nidPdfUrl?: string;

  @ApiPropertyOptional({ description: 'Cloudinary URL after upload' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class BankDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ibanNumber?: string;

  @ApiPropertyOptional({ description: 'Cloudinary URL after upload' })
  @IsOptional()
  @IsString()
  bankStatementPdfUrl?: string;
}

export class DocumentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Cloudinary URL after upload' })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}

// ─── Create Employee DTO ────────────────────────────────────────────────────

export class CreateEmployeeDto {
  // Identity
  @ApiProperty({ example: 'EMP-001' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'john@gmail.com' })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiProperty({ description: 'Min 8 chars, upper+lower+number+special' })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Must contain uppercase letter' })
  @Matches(/[a-z]/, { message: 'Must contain lowercase letter' })
  @Matches(/[0-9]/, { message: 'Must contain number' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Must contain special character' })
  password!: string;

  // Personal
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullNameEnglish!: string;

  @ApiPropertyOptional({ example: 'জন ডো' })
  @IsOptional()
  @IsString()
  fullNameBangla?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  personalMobileNumber?: string;

  @ApiProperty({ example: 'Islam' })
  @IsString()
  @IsNotEmpty()
  religion!: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  @IsNotEmpty()
  gender!: string;

  @ApiProperty({ example: '1995-01-15' })
  @IsString()
  @IsNotEmpty()
  dateOfBirth!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ enum: ['Single', 'Married', 'Divorced', 'Widowed'] })
  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @ApiPropertyOptional({ description: 'Cloudinary URL' })
  @IsOptional()
  @IsString()
  employeePhotoUrl?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nidNumber!: string;

  @ApiPropertyOptional({ description: 'Cloudinary URL' })
  @IsOptional()
  @IsString()
  nidPdfUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tinNumber?: string;

  // Family lineage
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fatherNameEnglish?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fatherNameBangla?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motherNameEnglish?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motherNameBangla?: string;

  // Address
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  permanentAddress?: string;

  // Emergency contact
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactNumber?: string;

  // Employment
  @ApiProperty({ description: 'UUID of the designation' })
  @IsUUID()
  designationId!: string;

  @ApiProperty({ description: 'UUID of the department' })
  @IsUUID()
  departmentId!: string;

  @ApiProperty({ example: 'Full-time', enum: ['Full-time', 'Part-time', 'Contract', 'Probation', 'Intern'] })
  @IsString()
  @IsNotEmpty()
  employeeType!: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsString()
  @IsNotEmpty()
  joinDate!: string;

  @ApiPropertyOptional({ description: 'UUID of line manager employee' })
  @IsOptional()
  @IsUUID()
  lineManagerId?: string;

  // Nested objects
  @ApiPropertyOptional({ type: [SpouseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpouseDto)
  spouses?: SpouseDto[];

  @ApiPropertyOptional({ type: [ChildDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildDto)
  children?: ChildDto[];

  @ApiPropertyOptional({ type: [NomineeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NomineeDto)
  nominees?: NomineeDto[];

  @ApiPropertyOptional({ type: BankDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ type: [DocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents?: DocumentDto[];
}
