import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { NotificationEventPayload } from '../events/notification-event.types';

@Injectable()
export class InAppNotificationChannel {
  private readonly logger = new Logger(InAppNotificationChannel.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async send(payload: NotificationEventPayload) {
    try {
      const record = await this.prisma.notification.create({
        data: {
          userId: payload.recipientUserId,
          title: payload.title,
          body: payload.body,
          channel: 'IN_APP',
          eventType: payload.eventType,
          entityType: payload.entityType || null,
          entityId: payload.entityId || null,
          metadata: payload.metadata || {},
          deliveryStatus: 'DELIVERED',
        },
      });

      // Realtime websocket / pubsub push to user's personal channel
      const streamPayload = JSON.stringify({
        id: record.id,
        title: record.title,
        body: record.body,
        eventType: record.eventType,
        entityType: record.entityType,
        entityId: record.entityId,
        metadata: record.metadata,
        createdAt: record.createdAt,
      });

      await this.redis.publish(`notifications:realtime:${payload.recipientUserId}`, streamPayload);

      return { success: true, channel: 'IN_APP', notificationId: record.id };
    } catch (error) {
      this.logger.error(`Failed to dispatch in-app notification: ${error.message}`, error.stack);
      return { success: false, channel: 'IN_APP', error: error.message };
    }
  }
}
