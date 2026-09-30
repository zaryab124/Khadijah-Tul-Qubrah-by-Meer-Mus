import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { InAppNotificationChannel } from './channels/in-app.channel';
import { EmailNotificationChannel } from './channels/email.channel';
import { PushNotificationChannel } from './channels/push.channel';
import { SmsNotificationChannel } from './channels/sms.channel';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { NotificationChannel, NotificationEventType } from './events/notification-event.types';

describe('NotificationsService (Phase 10 — Centralized Notification Service)', () => {
  let service: NotificationsService;
  let prisma: any;
  let redis: any;
  let inAppChannel: any;
  let emailChannel: any;
  let pushChannel: any;
  let smsChannel: any;

  const mockCustomerId = 'cust-uuid-1001';
  const mockCustomer2Id = 'cust-uuid-2002';
  const mockAgentId = 'agent-uuid-3003';
  const mockDesignerId = 'designer-uuid-4004';
  const mockAdminId = 'admin-uuid-5005';

  const defaultPreferences = {
    id: 'pref-1',
    userId: mockCustomerId,
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    orderUpdates: true,
    marketingAlerts: false,
  };

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      notificationPreference: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    redis = {
      rpush: jest.fn().mockResolvedValue(1),
      publish: jest.fn().mockResolvedValue(1),
    };

    inAppChannel = {
      send: jest.fn().mockResolvedValue({ success: true, channel: 'IN_APP', notificationId: 'notif-1' }),
    };

    emailChannel = {
      send: jest.fn().mockResolvedValue({ success: true, channel: 'EMAIL', queued: true }),
    };

    pushChannel = {
      send: jest.fn().mockResolvedValue({ success: true, channel: 'PUSH', queued: true }),
    };

    smsChannel = {
      send: jest.fn().mockResolvedValue({ success: true, channel: 'SMS', queued: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: InAppNotificationChannel, useValue: inAppChannel },
        { provide: EmailNotificationChannel, useValue: emailChannel },
        { provide: PushNotificationChannel, useValue: pushChannel },
        { provide: SmsNotificationChannel, useValue: smsChannel },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('User Preferences & Channel Routing', () => {
    it('should create default preferences if none exist for user', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue(null);
      prisma.notificationPreference.create.mockResolvedValue(defaultPreferences);

      const prefs = await service.getUserPreferences(mockCustomerId);

      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId: mockCustomerId },
      });
      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockCustomerId,
          inAppEnabled: true,
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
        }),
      });
      expect(prefs.inAppEnabled).toBe(true);
    });

    it('should honor disabled channels in user preferences', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue({
        ...defaultPreferences,
        emailEnabled: false,
        pushEnabled: false,
        smsEnabled: false,
        inAppEnabled: true,
      });

      const res = await service.dispatch({
        eventType: NotificationEventType.PAYMENT_SUCCESSFUL,
        recipientUserId: mockCustomerId,
        title: 'Payment Received',
        body: 'PKR 150,000 received',
      });

      // Dispatched channels should only be IN_APP
      expect(res.dispatchedChannels).toEqual([NotificationChannel.IN_APP]);
      expect(inAppChannel.send).toHaveBeenCalled();
      expect(emailChannel.send).not.toHaveBeenCalled();
      expect(pushChannel.send).not.toHaveBeenCalled();
      expect(smsChannel.send).not.toHaveBeenCalled();
      // Should also enqueue to master redis queue
      expect(redis.rpush).toHaveBeenCalledWith('notifications:queue', expect.any(String));
    });

    it('should route to SMS when user preference has smsEnabled: true', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue({
        ...defaultPreferences,
        smsEnabled: true,
      });

      const res = await service.dispatch({
        eventType: NotificationEventType.ORDER_SHIPPED,
        recipientUserId: mockCustomerId,
        title: 'Order Dispatched',
        body: 'Your package is on its way',
      });

      expect(res.dispatchedChannels).toContain(NotificationChannel.SMS);
      expect(smsChannel.send).toHaveBeenCalled();
    });

    it('should update user preferences cleanly', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue(defaultPreferences);
      prisma.notificationPreference.update.mockResolvedValue({
        ...defaultPreferences,
        smsEnabled: true,
        marketingAlerts: true,
      });

      const updated = await service.updateUserPreferences(mockCustomerId, {
        smsEnabled: true,
        marketingAlerts: true,
      });

      expect(prisma.notificationPreference.update).toHaveBeenCalledWith({
        where: { userId: mockCustomerId },
        data: { smsEnabled: true, marketingAlerts: true },
      });
      expect(updated.smsEnabled).toBe(true);
    });
  });

  describe('13 Major Notification Events & Recipient Verification', () => {
    beforeEach(() => {
      prisma.notificationPreference.findUnique.mockResolvedValue(defaultPreferences);
    });

    it('1. Event: NEW_LEAD — dispatched to admin/manager with lead details', async () => {
      const res = await service.triggerNewLead({
        recipientUserId: mockAdminId,
        leadId: 'lead-1',
        leadNumber: 'LED-2026-001',
        fullName: 'Zara Sheikh',
        source: 'Instagram',
      });

      expect(res.eventType).toBe(NotificationEventType.NEW_LEAD);
      expect(res.recipientUserId).toBe(mockAdminId);
      expect(inAppChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: NotificationEventType.NEW_LEAD,
          recipientUserId: mockAdminId,
          entityType: 'LEAD',
          entityId: 'lead-1',
        }),
      );
    });

    it('2. Event: LEAD_ASSIGNED — dispatched to designated agent', async () => {
      const res = await service.triggerLeadAssigned({
        assignedAgentId: mockAgentId,
        leadId: 'lead-1',
        leadNumber: 'LED-2026-001',
        fullName: 'Zara Sheikh',
      });

      expect(res.eventType).toBe(NotificationEventType.LEAD_ASSIGNED);
      expect(res.recipientUserId).toBe(mockAgentId);
    });

    it('3. Event: CUSTOM_REQUEST_SUBMITTED — dispatched to customer', async () => {
      const res = await service.triggerCustomRequestSubmitted({
        customerId: mockCustomerId,
        requestId: 'req-1',
        requestNumber: 'REQ-2026-001',
        title: 'Bespoke Zardozi Lehenga',
      });

      expect(res.eventType).toBe(NotificationEventType.CUSTOM_REQUEST_SUBMITTED);
      expect(res.recipientUserId).toBe(mockCustomerId);
    });

    it('4. Event: DESIGNER_ASSIGNED — dispatched to assigned designer', async () => {
      const res = await service.triggerDesignerAssigned({
        assignedDesignerId: mockDesignerId,
        requestId: 'req-1',
        requestNumber: 'REQ-2026-001',
        customerName: 'Amina Khan',
      });

      expect(res.eventType).toBe(NotificationEventType.DESIGNER_ASSIGNED);
      expect(res.recipientUserId).toBe(mockDesignerId);
    });

    it('5. Event: QUOTATION_READY — dispatched to customer with pricing and rev number', async () => {
      const res = await service.triggerQuotationReady({
        customerId: mockCustomerId,
        quotationId: 'quote-1',
        quotationNumber: 'Q-2026-001',
        versionNumber: 2,
        totalAmount: 350000,
      });

      expect(res.eventType).toBe(NotificationEventType.QUOTATION_READY);
      expect(res.recipientUserId).toBe(mockCustomerId);
    });

    it('6. Event: QUOTATION_REVISION_REQUESTED — dispatched to designer', async () => {
      const res = await service.triggerQuotationRevisionRequested({
        designerId: mockDesignerId,
        quotationId: 'quote-1',
        quotationNumber: 'Q-2026-001',
        revisionNotes: 'Change dupatta fabric to pure silk organza',
      });

      expect(res.eventType).toBe(NotificationEventType.QUOTATION_REVISION_REQUESTED);
      expect(res.recipientUserId).toBe(mockDesignerId);
    });

    it('7. Event: QUOTATION_ACCEPTED — dispatched to designer/atelier', async () => {
      const res = await service.triggerQuotationAccepted({
        recipientUserId: mockDesignerId,
        quotationId: 'quote-1',
        quotationNumber: 'Q-2026-001',
        orderId: 'order-1',
      });

      expect(res.eventType).toBe(NotificationEventType.QUOTATION_ACCEPTED);
      expect(res.recipientUserId).toBe(mockDesignerId);
    });

    it('8. Event: PAYMENT_SUCCESSFUL — dispatched to customer', async () => {
      const res = await service.triggerPaymentSuccessful({
        customerId: mockCustomerId,
        orderId: 'order-1',
        orderNumber: 'ORD-2026-001',
        amount: 350000,
      });

      expect(res.eventType).toBe(NotificationEventType.PAYMENT_SUCCESSFUL);
      expect(res.recipientUserId).toBe(mockCustomerId);
    });

    it('9. Event: PRODUCTION_STARTED — dispatched to customer', async () => {
      const res = await service.triggerProductionStarted({
        customerId: mockCustomerId,
        jobId: 'job-1',
        jobNumber: 'JOB-2026-001',
        orderNumber: 'ORD-2026-001',
      });

      expect(res.eventType).toBe(NotificationEventType.PRODUCTION_STARTED);
      expect(res.recipientUserId).toBe(mockCustomerId);
    });

    it('10. Event: PRODUCTION_UPDATE — dispatched to customer with progress percentage', async () => {
      const res = await service.triggerProductionUpdate({
        customerId: mockCustomerId,
        jobId: 'job-1',
        jobNumber: 'JOB-2026-001',
        stage: 'EMBROIDERY',
        progressPercentage: 60,
      });

      expect(res.eventType).toBe(NotificationEventType.PRODUCTION_UPDATE);
      expect(res.recipientUserId).toBe(mockCustomerId);
    });

    it('11. Event: QUALITY_CHECK — dispatched to customer with QC status', async () => {
      const res = await service.triggerQualityCheck({
        customerId: mockCustomerId,
        jobId: 'job-1',
        jobNumber: 'JOB-2026-001',
        qcStatus: 'PASSED',
      });

      expect(res.eventType).toBe(NotificationEventType.QUALITY_CHECK);
      expect(res.recipientUserId).toBe(mockCustomerId);
    });

    it('12. Event: ORDER_SHIPPED — dispatched to customer with courier & tracking', async () => {
      const res = await service.triggerOrderShipped({
        customerId: mockCustomerId,
        orderId: 'order-1',
        orderNumber: 'ORD-2026-001',
        courierName: 'DHL Express',
        trackingNumber: 'DHL987654321',
      });

      expect(res.eventType).toBe(NotificationEventType.ORDER_SHIPPED);
      expect(res.recipientUserId).toBe(mockCustomerId);
    });

    it('13. Event: ORDER_DELIVERED — dispatched to customer', async () => {
      const res = await service.triggerOrderDelivered({
        customerId: mockCustomerId,
        orderId: 'order-1',
        orderNumber: 'ORD-2026-001',
      });

      expect(res.eventType).toBe(NotificationEventType.ORDER_DELIVERED);
      expect(res.recipientUserId).toBe(mockCustomerId);
    });
  });

  describe('Strict Privacy & Isolation Guarantee', () => {
    it('should only return notifications belonging to the requesting user', async () => {
      const userNotifs = [
        { id: 'n-1', userId: mockCustomerId, title: 'Alert 1', isRead: false },
        { id: 'n-2', userId: mockCustomerId, title: 'Alert 2', isRead: true },
      ];
      prisma.notification.findMany.mockResolvedValue(userNotifs);

      const result = await service.getUserNotifications(mockCustomerId);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: mockCustomerId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toHaveLength(2);
    });

    it('should reject unauthorized user attempting to mark another user notification as read', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 'notif-private-1',
        userId: mockCustomerId, // Belongs to Customer 1
        title: 'Private Order Info',
      });

      // Customer 2 attempts to mark Customer 1's notification as read
      await expect(
        service.markAsRead('notif-private-1', mockCustomer2Id),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('should permit owner to mark their own notification as read', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 'notif-own-1',
        userId: mockCustomerId,
        isRead: false,
      });
      prisma.notification.update.mockResolvedValue({
        id: 'notif-own-1',
        userId: mockCustomerId,
        isRead: true,
        readAt: new Date(),
      });

      const res = await service.markAsRead('notif-own-1', mockCustomerId);

      expect(res.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-own-1' },
        data: expect.objectContaining({ isRead: true }),
      });
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('non-existent', mockCustomerId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should correctly count unread notifications scoped to the user', async () => {
      prisma.notification.count.mockResolvedValue(4);

      const res = await service.getUnreadCount(mockCustomerId);

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: mockCustomerId, isRead: false },
      });
      expect(res.unreadCount).toBe(4);
    });

    it('should mark all notifications as read for current user only', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const res = await service.markAllAsRead(mockCustomerId);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockCustomerId, isRead: false },
        data: expect.objectContaining({ isRead: true }),
      });
      expect(res.updatedCount).toBe(5);
    });
  });

  describe('Channel Dispatch Unit Verification', () => {
    it('InAppNotificationChannel should create DB record and publish to realtime Redis stream', async () => {
      const realInApp = new InAppNotificationChannel(prisma, redis);
      prisma.notification.create.mockResolvedValue({
        id: 'db-notif-1',
        userId: mockCustomerId,
        title: 'New Haute Piece',
        body: 'Review specs',
        eventType: NotificationEventType.PRODUCTION_UPDATE,
        createdAt: new Date(),
      });

      const res = await realInApp.send({
        eventType: NotificationEventType.PRODUCTION_UPDATE,
        recipientUserId: mockCustomerId,
        title: 'New Haute Piece',
        body: 'Review specs',
      });

      expect(res.success).toBe(true);
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(redis.publish).toHaveBeenCalledWith(
        `notifications:realtime:${mockCustomerId}`,
        expect.stringContaining('New Haute Piece'),
      );
    });

    it('EmailNotificationChannel should render luxury template and queue to Redis', async () => {
      const realEmail = new EmailNotificationChannel(prisma, redis);
      prisma.user.findUnique.mockResolvedValue({
        id: mockCustomerId,
        email: 'patron@luxury.com',
        firstName: 'Farah',
        lastName: 'Naz',
      });

      const res = await realEmail.send({
        eventType: NotificationEventType.QUOTATION_READY,
        recipientUserId: mockCustomerId,
        title: 'Quotation Prepared',
        body: 'Your quotation is ready for review.',
      });

      expect(res.success).toBe(true);
      expect(res.queued).toBe(true);
      expect(redis.rpush).toHaveBeenCalledWith(
        'notifications:queue:email',
        expect.stringContaining('KHADIJA-TUL-QUBRAH BY Meer&Mus'),
      );

    });

    it('PushNotificationChannel should enqueue structured push payload to Redis', async () => {
      const realPush = new PushNotificationChannel(redis);

      const res = await realPush.send({
        eventType: NotificationEventType.ORDER_SHIPPED,
        recipientUserId: mockCustomerId,
        title: 'Shipped',
        body: 'En route',
      });

      expect(res.success).toBe(true);
      expect(redis.rpush).toHaveBeenCalledWith(
        'notifications:queue:push',
        expect.stringContaining('KHADIJA-TUL-QUBRAH: Shipped'),
      );
    });

    it('SmsNotificationChannel should enqueue SMS if user phone is available', async () => {
      const realSms = new SmsNotificationChannel(prisma, redis);
      prisma.user.findUnique.mockResolvedValue({
        id: mockCustomerId,
        phoneNumber: '+923001234567',
      });

      const res = await realSms.send({
        eventType: NotificationEventType.PAYMENT_SUCCESSFUL,
        recipientUserId: mockCustomerId,
        title: 'Payment Received',
        body: 'Confirmed',
      });

      expect(res.success).toBe(true);
      expect(redis.rpush).toHaveBeenCalledWith(
        'notifications:queue:sms',
        expect.stringContaining('[KHADIJA-TUL-QUBRAH BY Meer&Mus]'),
      );
    });

    it('SmsNotificationChannel should skip gracefully if user has no phone configured', async () => {
      const realSms = new SmsNotificationChannel(prisma, redis);
      prisma.user.findUnique.mockResolvedValue({
        id: mockCustomerId,
        phoneNumber: null,
      });

      const res = await realSms.send({
        eventType: NotificationEventType.PAYMENT_SUCCESSFUL,
        recipientUserId: mockCustomerId,
        title: 'Payment Received',
        body: 'Confirmed',
      });

      expect(res.success).toBe(false);
      expect(res.reason).toBe('NO_PHONE_NUMBER');
      expect(redis.rpush).not.toHaveBeenCalled();
    });
  });
});
