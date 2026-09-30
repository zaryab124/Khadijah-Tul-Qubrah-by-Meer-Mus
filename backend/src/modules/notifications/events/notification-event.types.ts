import { NotificationChannel, NotificationEventType } from '@prisma/client';

export { NotificationChannel, NotificationEventType };

export interface NotificationEventPayload {
  eventType: NotificationEventType;
  recipientUserId: string;
  title: string;
  body: string;
  entityType?: 'LEAD' | 'CUSTOM_REQUEST' | 'QUOTATION' | 'ORDER' | 'PRODUCTION_JOB' | 'USER';
  entityId?: string;
  metadata?: Record<string, any>;
  preferredChannels?: NotificationChannel[];
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}
