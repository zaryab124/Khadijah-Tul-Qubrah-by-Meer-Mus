import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { NotificationEventPayload } from '../events/notification-event.types';

@Injectable()
export class EmailNotificationChannel {
  private readonly logger = new Logger(EmailNotificationChannel.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async send(payload: NotificationEventPayload) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.recipientUserId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!user || !user.email) {
        this.logger.warn(`User ${payload.recipientUserId} has no email. Skipping email dispatch.`);
        return { success: false, channel: 'EMAIL', reason: 'NO_EMAIL' };
      }

      const recipientName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Patron';
      const html = this.renderLuxuryEmailTemplate(recipientName, payload.title, payload.body, payload.eventType);

      const emailJob = {
        to: user.email,
        recipientName,
        subject: `KHADIJA-TUL-QUBRAH BY Meer&Mus — ${payload.title}`,
        html,
        eventType: payload.eventType,
        queuedAt: new Date().toISOString(),
      };

      // Push to Redis background queue for transactional email delivery worker
      await this.redis.rpush('notifications:queue:email', JSON.stringify(emailJob));

      this.logger.log(`Queued luxury email to ${user.email} for event ${payload.eventType}`);

      return {
        success: true,
        channel: 'EMAIL',
        recipientEmail: user.email,
        queued: true,
      };
    } catch (error) {
      this.logger.error(`Failed to dispatch email notification: ${error.message}`, error.stack);
      return { success: false, channel: 'EMAIL', error: error.message };
    }
  }

  private renderLuxuryEmailTemplate(
    recipientName: string,
    title: string,
    body: string,
    eventType: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Playfair Display', Georgia, serif; background-color: #0F0F11; color: #E5E5E5; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #18181B; border: 1px solid #27272A; border-top: 3px solid #C5A880; border-radius: 4px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { text-align: center; border-bottom: 1px solid #27272A; padding-bottom: 24px; margin-bottom: 28px; }
    .brand-title { font-size: 22px; font-weight: 700; letter-spacing: 3px; color: #C5A880; text-transform: uppercase; margin: 0; }
    .brand-sub { font-size: 11px; letter-spacing: 2px; color: #A1A1AA; text-transform: uppercase; margin-top: 6px; }
    .content-title { font-size: 18px; color: #FFFFFF; margin-top: 0; margin-bottom: 16px; font-weight: 600; }
    .greeting { font-size: 15px; color: #D4D4D8; margin-bottom: 16px; line-height: 1.6; }
    .message { font-size: 15px; color: #A1A1AA; line-height: 1.7; margin-bottom: 24px; }
    .tag { display: inline-block; background: #27272A; color: #C5A880; font-size: 11px; letter-spacing: 1px; padding: 4px 10px; border-radius: 2px; text-transform: uppercase; margin-bottom: 20px; }
    .footer { text-align: center; border-top: 1px solid #27272A; padding-top: 24px; margin-top: 32px; font-size: 12px; color: #71717A; line-height: 1.5; font-family: sans-serif; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">KHADIJA-TUL-QUBRAH</h1>
      <div class="brand-sub">BY MEER&MUS • HAUTE COUTURE ATELIER</div>
    </div>
    <div class="tag">${eventType.replace(/_/g, ' ')}</div>
    <div class="greeting">Dearest ${recipientName},</div>
    <h2 class="content-title">${title}</h2>
    <div class="message">${body}</div>
    <div class="footer">
      <p>Thank you for entrusting your couture journey to KHADIJA-TUL-QUBRAH BY Meer&Mus.</p>
      <p>© 2026 KHADIJA-TUL-QUBRAH BY Meer&Mus. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
