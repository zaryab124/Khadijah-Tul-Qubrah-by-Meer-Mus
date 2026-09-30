import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { InAppNotificationChannel } from './channels/in-app.channel';
import { EmailNotificationChannel } from './channels/email.channel';
import { PushNotificationChannel } from './channels/push.channel';
import { SmsNotificationChannel } from './channels/sms.channel';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    InAppNotificationChannel,
    EmailNotificationChannel,
    PushNotificationChannel,
    SmsNotificationChannel,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
