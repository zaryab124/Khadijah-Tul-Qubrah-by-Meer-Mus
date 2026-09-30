import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { NotificationEventPayload } from '../events/notification-event.types';

@Injectable()
export class SmsNotificationChannel {
  private readonly logger = new Logger(SmsNotificationChannel.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async send(payload: NotificationEventPayload) {
    try {
      // Look up user's phone number
      const user = await this.prisma.user.findUnique({
        where: { id: payload.recipientUserId },
        select: { id: true, phoneNumber: true },
      });

      const phoneNumber = payload.metadata?.phoneNumber || user?.phoneNumber;

      if (!phoneNumber) {
        this.logger.debug(`User ${payload.recipientUserId} has no phone configured. Skipping SMS.`);
        return { success: false, channel: 'SMS', reason: 'NO_PHONE_NUMBER' };
      }

      const smsText = `[KHADIJA-TUL-QUBRAH BY Meer&Mus] ${payload.title}: ${payload.body}`.slice(0, 160);

      const smsJob = {
        to: phoneNumber,
        text: smsText,
        eventType: payload.eventType,
        queuedAt: new Date().toISOString(),
      };

      await this.redis.rpush('notifications:queue:sms', JSON.stringify(smsJob));
      this.logger.log(`Queued SMS to ${phoneNumber} for user ${payload.recipientUserId}`);

      return { success: true, channel: 'SMS', recipientPhone: phoneNumber, queued: true };
    } catch (error) {
      this.logger.error(`Failed to dispatch SMS notification: ${error.message}`, error.stack);
      return { success: false, channel: 'SMS', error: error.message };
    }
  }
}
