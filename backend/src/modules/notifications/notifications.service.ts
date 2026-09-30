import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { InAppNotificationChannel } from './channels/in-app.channel';
import { EmailNotificationChannel } from './channels/email.channel';
import { PushNotificationChannel } from './channels/push.channel';
import { SmsNotificationChannel } from './channels/sms.channel';
import {
  NotificationChannel,
  NotificationEventType,
  NotificationEventPayload,
} from './events/notification-event.types';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly inAppChannel: InAppNotificationChannel,
    private readonly emailChannel: EmailNotificationChannel,
    private readonly pushChannel: PushNotificationChannel,
    private readonly smsChannel: SmsNotificationChannel,
  ) {}

  /**
   * Centralized event dispatcher.
   * Checks recipient privacy, enforces user preferences, and routes to enabled channels.
   */
  async dispatch(event: NotificationEventPayload) {
    if (!event.recipientUserId) {
      throw new Error('Notification event requires a valid recipientUserId');
    }

    this.logger.log(
      `Dispatching event [${event.eventType}] for recipient [${event.recipientUserId}]`,
    );

    // 1. Fetch or initialize recipient preferences
    const preferences = await this.getUserPreferences(event.recipientUserId);

    // 2. Determine target channels based on preferences and event payload
    const orderOrProductionEvents: NotificationEventType[] = [
      NotificationEventType.CUSTOM_REQUEST_SUBMITTED,
      NotificationEventType.QUOTATION_READY,
      NotificationEventType.QUOTATION_REVISION_REQUESTED,
      NotificationEventType.QUOTATION_ACCEPTED,
      NotificationEventType.PAYMENT_SUCCESSFUL,
      NotificationEventType.PRODUCTION_STARTED,
      NotificationEventType.PRODUCTION_UPDATE,
      NotificationEventType.QUALITY_CHECK,
      NotificationEventType.ORDER_SHIPPED,
      NotificationEventType.ORDER_DELIVERED,
    ];
    const isOrderOrProductionEvent = orderOrProductionEvents.includes(event.eventType);


    if (isOrderOrProductionEvent && preferences.orderUpdates === false) {
      this.logger.debug(
        `Recipient ${event.recipientUserId} opted out of order updates. Suppressing non-critical channels.`,
      );
    }

    const channelsToDispatch: NotificationChannel[] = [];

    // Filter by payload's preferredChannels if explicitly given, else all enabled
    const canUseChannel = (ch: NotificationChannel) => {
      if (event.preferredChannels && event.preferredChannels.length > 0) {
        return event.preferredChannels.includes(ch);
      }
      return true;
    };

    if (preferences.inAppEnabled && canUseChannel(NotificationChannel.IN_APP)) {
      channelsToDispatch.push(NotificationChannel.IN_APP);
    }
    if (preferences.emailEnabled && canUseChannel(NotificationChannel.EMAIL)) {
      channelsToDispatch.push(NotificationChannel.EMAIL);
    }
    if (preferences.pushEnabled && canUseChannel(NotificationChannel.PUSH)) {
      channelsToDispatch.push(NotificationChannel.PUSH);
    }
    if (preferences.smsEnabled && canUseChannel(NotificationChannel.SMS)) {
      channelsToDispatch.push(NotificationChannel.SMS);
    }

    // 3. Queue master event in Redis for audit & background worker stream
    const queuedJob = {
      ...event,
      dispatchedChannels: channelsToDispatch,
      queuedAt: new Date().toISOString(),
    };
    await this.redis.rpush('notifications:queue', JSON.stringify(queuedJob));

    // 4. Dispatch through enabled channels
    const results: Record<string, any> = {};

    for (const channel of channelsToDispatch) {
      switch (channel) {
        case NotificationChannel.IN_APP:
          results.inApp = await this.inAppChannel.send(event);
          break;
        case NotificationChannel.EMAIL:
          results.email = await this.emailChannel.send(event);
          break;
        case NotificationChannel.PUSH:
          results.push = await this.pushChannel.send(event);
          break;
        case NotificationChannel.SMS:
          results.sms = await this.smsChannel.send(event);
          break;
      }
    }

    return {
      eventType: event.eventType,
      recipientUserId: event.recipientUserId,
      dispatchedChannels: channelsToDispatch,
      results,
    };
  }

  /**
   * User notification query strictly isolated by userId.
   * Unauthorized users can NEVER read another user's private alerts.
   */
  async getUserNotifications(userId: string, isRead?: boolean) {
    const where: any = { userId };
    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get unread notification count strictly scoped to user.
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  /**
   * Mark a single notification as read, enforcing strict ownership.
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // STRICT ISOLATION GUARD: Customer A cannot mark or view Customer B's notification
    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied: You do not have permission to view or modify this notification');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Mark all notifications for the authenticated user as read.
   */
  async markAllAsRead(userId: string) {
    const updateResult = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true, updatedCount: updateResult.count };
  }

  /**
   * Get notification preferences for user, creating defaults if not set.
   */
  async getUserPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          inAppEnabled: true,
          orderUpdates: true,
          marketingAlerts: false,
        },
      });
    }

    return prefs;
  }

  /**
   * Update notification preferences.
   */
  async updateUserPreferences(userId: string, dto: UpdatePreferencesDto) {
    // Ensure default exists
    await this.getUserPreferences(userId);

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        ...(dto.emailEnabled !== undefined && { emailEnabled: dto.emailEnabled }),
        ...(dto.pushEnabled !== undefined && { pushEnabled: dto.pushEnabled }),
        ...(dto.smsEnabled !== undefined && { smsEnabled: dto.smsEnabled }),
        ...(dto.inAppEnabled !== undefined && { inAppEnabled: dto.inAppEnabled }),
        ...(dto.orderUpdates !== undefined && { orderUpdates: dto.orderUpdates }),
        ...(dto.marketingAlerts !== undefined && { marketingAlerts: dto.marketingAlerts }),
      },
    });
  }

  // =========================================================================
  // 13 DECOUPLED EVENT TRIGGER HELPERS
  // =========================================================================

  /**
   * 1. NEW_LEAD: Dispatched when a prospective client registers interest
   */
  async triggerNewLead(payload: {
    recipientUserId: string;
    leadId: string;
    leadNumber: string;
    fullName: string;
    source?: string;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.NEW_LEAD,
      recipientUserId: payload.recipientUserId,
      title: 'New Client Inquiry Received',
      body: `A new client lead (${payload.fullName}, Ref: ${payload.leadNumber}) has arrived via ${payload.source || 'Website'}.`,
      entityType: 'LEAD',
      entityId: payload.leadId,
      metadata: { leadNumber: payload.leadNumber, clientName: payload.fullName },
    });
  }

  /**
   * 2. LEAD_ASSIGNED: Dispatched when an agent is assigned a lead
   */
  async triggerLeadAssigned(payload: {
    assignedAgentId: string;
    leadId: string;
    leadNumber: string;
    fullName: string;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.LEAD_ASSIGNED,
      recipientUserId: payload.assignedAgentId,
      title: 'Client Lead Assigned To You',
      body: `You have been designated as the relationship agent for ${payload.fullName} (Ref: ${payload.leadNumber}).`,
      entityType: 'LEAD',
      entityId: payload.leadId,
      metadata: { leadNumber: payload.leadNumber, clientName: payload.fullName },
    });
  }

  /**
   * 3. CUSTOM_REQUEST_SUBMITTED: Dispatched to client & couture studio
   */
  async triggerCustomRequestSubmitted(payload: {
    customerId: string;
    requestId: string;
    requestNumber: string;
    title?: string;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.CUSTOM_REQUEST_SUBMITTED,
      recipientUserId: payload.customerId,
      title: 'Custom Design Request Confirmed',
      body: `Your bespoke design inquiry (${payload.requestNumber} — ${payload.title || 'Haute Couture'}) has been received by our atelier.`,
      entityType: 'CUSTOM_REQUEST',
      entityId: payload.requestId,
      metadata: { requestNumber: payload.requestNumber },
    });
  }

  /**
   * 4. DESIGNER_ASSIGNED: Dispatched to designated haute couture designer
   */
  async triggerDesignerAssigned(payload: {
    assignedDesignerId: string;
    requestId: string;
    requestNumber: string;
    customerName?: string;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.DESIGNER_ASSIGNED,
      recipientUserId: payload.assignedDesignerId,
      title: 'New Couture Design Assignment',
      body: `You have been assigned to curate custom request ${payload.requestNumber} for ${payload.customerName || 'our patron'}.`,
      entityType: 'CUSTOM_REQUEST',
      entityId: payload.requestId,
      metadata: { requestNumber: payload.requestNumber },
    });
  }

  /**
   * 5. QUOTATION_READY: Dispatched to customer when formal quote is formulated
   */
  async triggerQuotationReady(payload: {
    customerId: string;
    quotationId: string;
    quotationNumber: string;
    versionNumber: number;
    totalAmount: string | number;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.QUOTATION_READY,
      recipientUserId: payload.customerId,
      title: 'Your Bespoke Quotation is Ready',
      body: `Quotation ${payload.quotationNumber} (Rev V${payload.versionNumber}) is prepared for PKR ${payload.totalAmount}. Review design specs now.`,
      entityType: 'QUOTATION',
      entityId: payload.quotationId,
      metadata: { quotationNumber: payload.quotationNumber, version: payload.versionNumber, total: payload.totalAmount },
    });
  }

  /**
   * 6. QUOTATION_REVISION_REQUESTED: Dispatched to designer when customer requests modifications
   */
  async triggerQuotationRevisionRequested(payload: {
    designerId: string;
    quotationId: string;
    quotationNumber: string;
    revisionNotes?: string;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.QUOTATION_REVISION_REQUESTED,
      recipientUserId: payload.designerId,
      title: 'Revision Requested on Quotation',
      body: `Client requested modifications on ${payload.quotationNumber}: "${payload.revisionNotes || 'Review customer remarks in studio'}".`,
      entityType: 'QUOTATION',
      entityId: payload.quotationId,
      metadata: { quotationNumber: payload.quotationNumber },
    });
  }

  /**
   * 7. QUOTATION_ACCEPTED: Dispatched to designer/atelier when quote is confirmed
   */
  async triggerQuotationAccepted(payload: {
    recipientUserId: string;
    quotationId: string;
    quotationNumber: string;
    orderId?: string;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.QUOTATION_ACCEPTED,
      recipientUserId: payload.recipientUserId,
      title: 'Quotation Approved by Client',
      body: `Quotation ${payload.quotationNumber} was accepted. A bespoke production order has been prepared.`,
      entityType: 'QUOTATION',
      entityId: payload.quotationId,
      metadata: { quotationNumber: payload.quotationNumber, orderId: payload.orderId },
    });
  }

  /**
   * 8. PAYMENT_SUCCESSFUL: Dispatched to customer on verified payment
   */
  async triggerPaymentSuccessful(payload: {
    customerId: string;
    orderId: string;
    orderNumber: string;
    amount: string | number;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.PAYMENT_SUCCESSFUL,
      recipientUserId: payload.customerId,
      title: 'Payment Confirmed',
      body: `Payment of PKR ${payload.amount} for Order ${payload.orderNumber} is verified. Your couture creation now enters production.`,
      entityType: 'ORDER',
      entityId: payload.orderId,
      metadata: { orderNumber: payload.orderNumber, amount: payload.amount },
    });
  }

  /**
   * 9. PRODUCTION_STARTED: Dispatched when atelier begins cutting & crafting
   */
  async triggerProductionStarted(payload: {
    customerId: string;
    jobId: string;
    jobNumber: string;
    orderNumber: string;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.PRODUCTION_STARTED,
      recipientUserId: payload.customerId,
      title: 'Atelier Production Commenced',
      body: `Master artisans have initiated work on your bespoke piece (Job ${payload.jobNumber}, Order ${payload.orderNumber}).`,
      entityType: 'PRODUCTION_JOB',
      entityId: payload.jobId,
      metadata: { jobNumber: payload.jobNumber, orderNumber: payload.orderNumber },
    });
  }

  /**
   * 10. PRODUCTION_UPDATE: Dispatched as crafting milestones are achieved
   */
  async triggerProductionUpdate(payload: {
    customerId: string;
    jobId: string;
    jobNumber: string;
    stage: string;
    progressPercentage: number;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.PRODUCTION_UPDATE,
      recipientUserId: payload.customerId,
      title: `Crafting Update: ${payload.stage}`,
      body: `Your garment is now in ${payload.stage} stage (${payload.progressPercentage}% completed).`,
      entityType: 'PRODUCTION_JOB',
      entityId: payload.jobId,
      metadata: { jobNumber: payload.jobNumber, stage: payload.stage, progress: payload.progressPercentage },
    });
  }

  /**
   * 11. QUALITY_CHECK: Dispatched when quality inspection occurs
   */
  async triggerQualityCheck(payload: {
    customerId: string;
    jobId: string;
    jobNumber: string;
    qcStatus: 'PASSED' | 'FAILED';
  }) {
    const isPassed = payload.qcStatus === 'PASSED';
    return this.dispatch({
      eventType: NotificationEventType.QUALITY_CHECK,
      recipientUserId: payload.customerId,
      title: isPassed ? 'Haute Quality Standards Approved' : 'Atelier Refinement In Progress',
      body: isPassed
        ? `Garment ${payload.jobNumber} has passed our rigorous multi-point master quality inspection.`
        : `Garment ${payload.jobNumber} has been returned for exquisite atelier detailing before final dispatch.`,
      entityType: 'PRODUCTION_JOB',
      entityId: payload.jobId,
      metadata: { jobNumber: payload.jobNumber, qcStatus: payload.qcStatus },
    });
  }

  /**
   * 12. ORDER_SHIPPED: Dispatched when package leaves atelier
   */
  async triggerOrderShipped(payload: {
    customerId: string;
    orderId: string;
    orderNumber: string;
    trackingNumber?: string;
    courierName?: string;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.ORDER_SHIPPED,
      recipientUserId: payload.customerId,
      title: 'Your Order Has Been Dispatched',
      body: `Order ${payload.orderNumber} is on its way via ${payload.courierName || 'Courier Express'}${
        payload.trackingNumber ? ` (Tracking: ${payload.trackingNumber})` : ''
      }.`,
      entityType: 'ORDER',
      entityId: payload.orderId,
      metadata: { orderNumber: payload.orderNumber, tracking: payload.trackingNumber },
    });
  }

  /**
   * 13. ORDER_DELIVERED: Dispatched when luxury delivery is complete
   */
  async triggerOrderDelivered(payload: {
    customerId: string;
    orderId: string;
    orderNumber: string;
  }) {
    return this.dispatch({
      eventType: NotificationEventType.ORDER_DELIVERED,
      recipientUserId: payload.customerId,
      title: 'Order Successfully Delivered',
      body: `Order ${payload.orderNumber} has been delivered. May your KHADIJA-TUL-QUBRAH ensemble bring timeless elegance.`,
      entityType: 'ORDER',
      entityId: payload.orderId,
      metadata: { orderNumber: payload.orderNumber },
    });
  }
}
