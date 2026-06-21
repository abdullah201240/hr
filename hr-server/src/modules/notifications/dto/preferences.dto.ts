import { IsOptional, IsArray, IsEnum, IsBoolean, IsString, Matches } from 'class-validator';
import { NotificationModule, NotificationCategory } from '../types/notification.types';

export enum DigestFrequency {
  REALTIME = 'realtime',
  HOURLY = 'hourly',
  DAILY = 'daily',
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationModule, { each: true })
  disabledModules?: NotificationModule[];

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationCategory, { each: true })
  disabledCategories?: NotificationCategory[];

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'quietHoursStart must be in HH:MM format' })
  quietHoursStart?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'quietHoursEnd must be in HH:MM format' })
  quietHoursEnd?: string;

  @IsOptional()
  @IsString()
  @IsEnum(DigestFrequency)
  digestFrequency?: DigestFrequency;
}
