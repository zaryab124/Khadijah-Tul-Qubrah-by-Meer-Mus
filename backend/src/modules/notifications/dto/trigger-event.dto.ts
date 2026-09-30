import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationChannel, NotificationEventType } from '../events/notification-event.types';

export class TriggerNotificationEventDto {
  @ApiProperty({ enum: NotificationEventType, description: 'Type of the notification event' })
  @IsEnum(NotificationEventType)
  @IsNotEmpty()
  eventType: NotificationEventType;

  @ApiProperty({ description: 'Target recipient user ID' })
  @IsUUID()
  @IsNotEmpty()
  recipientUserId: string;

  @ApiProperty({ description: 'Title of the notification' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Body text or summary' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Related entity type (e.g., ORDER, LEAD, QUOTATION)' })
  @IsString()
  @IsOptional()
  entityType?: 'LEAD' | 'CUSTOM_REQUEST' | 'QUOTATION' | 'ORDER' | 'PRODUCTION_JOB' | 'USER';

  @ApiPropertyOptional({ description: 'Related entity UUID' })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Additional structured metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true, description: 'Optional preferred channels filter' })
  @IsOptional()
  preferredChannels?: NotificationChannel[];

  @ApiPropertyOptional({ enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  @IsOptional()
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}
