import { IsOptional, IsString, IsEnum, IsInt, Max } from 'class-validator';
import { NotificationModule, NotificationCategory } from '../types/notification.types';

export class NotificationQueryDto {
  @IsOptional()
  @IsEnum(NotificationModule)
  module?: NotificationModule;

  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @IsOptional()
  @IsString()
  isRead?: string; // 'true' | 'false'

  @IsOptional()
  @IsString()
  isArchived?: string; // 'true' | 'false', defaults to 'false'

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  cursor?: string; // CreatedAt ISO string cursor

  @IsOptional()
  @IsInt()
  @Max(50)
  limit?: number; // Defaults to 20, max 50
}
