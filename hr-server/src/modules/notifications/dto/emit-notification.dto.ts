import { IsUUID, IsOptional, IsEnum, IsString, MaxLength, IsObject, IsArray, IsDateString } from 'class-validator';
import { NotificationModule, NotificationCategory, NotificationAction, NotificationPriority } from '../types/notification.types';

export class EmitNotificationDto {
  @IsUUID()
  recipientId!: string;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsEnum(NotificationModule)
  module!: NotificationModule;

  @IsEnum(NotificationCategory)
  category!: NotificationCategory;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsArray()
  actions?: NotificationAction[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  dedupKey?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class BroadcastDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  recipientIds?: string[];

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}
