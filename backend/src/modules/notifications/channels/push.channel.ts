import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { NotificationEventPayload } from '../events/notification-event.types';

@Injectable()
export class PushNotificationChannel {
  private readonly logger = new Logger(PushNotificationChannel.name);

  constructor(private readonly redis: RedisService) {}

  async send(payload: NotificationEventPayload) {
    try {
      const pushJob = {
        userId: payload.recipientUserId,
        notification: {
          title: `KHADIJA-TUL-QUBRAH: ${payload.title}`,
          body: payload.body,
        },
        data: {
          eventType: payload.eventType,
          entityType: payload.entityType || '',
          entityId: payload.entityId || '',
          ...(payload.metadata || {}),
        },
        queuedAt: new Date().toISOString(),
      };

      await this.redis.rpush('notifications:queue:push', JSON.stringify(pushJob));
      this.logger.log(`Queued push notification for user ${payload.recipientUserId}`);

      return { success: true, channel: 'PUSH', queued: true };
    } catch (error) {
      this.logger.error(`Failed to dispatch push notification: ${error.message}`, error.stack);
      return { success: false, channel: 'PUSH', error: error.message };
    }
  }
}
