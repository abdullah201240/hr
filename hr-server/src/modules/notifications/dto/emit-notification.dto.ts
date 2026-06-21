import { IsUUID, IsOptional, IsEnum, IsString, MaxLength, IsObject, IsArray } from 'class-validator';
import { NotificationModule, NotificationCategory, NotificationAction } from '../types/notification.types';

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
  @IsString()
  priority?: string; // low, normal, high, urgent

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
  expiresAt?: Date;
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
  recipientIds?: string[]; // Empty means everyone

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  priority?: string;
}
