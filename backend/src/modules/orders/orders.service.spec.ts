import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { MockGatewayProvider } from '../payments/providers/mock-gateway.provider';
import { StripePaymentProvider } from '../payments/providers/stripe.provider';
import { BankWirePaymentProvider } from '../payments/providers/bank-wire.provider';

describe('Orders & Payments Engine (Phase 6 — Order and Payment System)', () => {
  let ordersService: OrdersService;
  let paymentsService: PaymentsService;
  let prismaService: any;
  let auditService: any;

  const mockCustomerA = {
    id: 'cust-A',
    role: UserRole.CUSTOMER,
    email: 'fatima@meermus.luxury',
    firstName: 'Fatima',
    lastName: 'Noor',
  };

  const mockCustomerB = {
    id: 'cust-B',
    role: UserRole.CUSTOMER,
    email: 'zara@meermus.luxury',
    firstName: 'Zara',
    lastName: 'Ahmed',
  };

  const mockAdmin = {
    id: 'admin-1',
    role: UserRole.ADMIN,
    email: 'director@meermus.luxury',
  };

  beforeEach(async () => {
    prismaService = {
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      orderItem: {
        create: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      address: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      customDesignRequest: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      customerProfile: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      campaign: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn((callback) => callback(prismaService)),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        PaymentsService,
        MockGatewayProvider,
        StripePaymentProvider,
        BankWirePaymentProvider,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(ordersService).toBeDefined();
    expect(paymentsService).toBeDefined();
  });

  describe('1. Normal Product Purchase Order Creation', () => {
    it('should create order from catalog variants with server totals and PENDING_PAYMENT status', async () => {
      prismaService.order.count.mockResolvedValue(0);
      prismaService.address.create.mockResolvedValue({ id: 'addr-shipping-1' });

      // Mock Product Variant
      prismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        sku: 'KTQ-PESH-001-EMR-M',
        stockQuantity: 10,
        priceAdjustment: new Prisma.Decimal(5000),
        isActive: true,
        product: {
          id: 'prod-1',
          name: 'Shahzadi Emerald Velvet Peshwas',
          slug: 'shahzadi-emerald-velvet-peshwas',
          basePrice: new Prisma.Decimal(180000),
          isActive: true,
        },
        colour: { name: 'Emerald Green' },
        size: { name: 'Medium' },
      });

      const mockCreatedOrder = {
        id: 'order-1',
        orderNumber: 'ORD-202609-0001',
        customerId: mockCustomerA.id,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotalAmount: new Prisma.Decimal(185000),
        shippingAmount: new Prisma.Decimal(2500),
        totalAmount: new Prisma.Decimal(187500),
        currency: 'PKR',
        orderItems: [
          {
            id: 'item-1',
            productVariantId: 'var-1',
            itemTitle: 'Shahzadi Emerald Velvet Peshwas - Emerald Green / Medium',
            unitPrice: new Prisma.Decimal(185000),
            quantity: 1,
            lineTotal: new Prisma.Decimal(185000),
          },
        ],
      };

      prismaService.order.create.mockResolvedValue(mockCreatedOrder);

      const result = await ordersService.createProductOrder(mockCustomerA.id, {
        items: [{ productVariantId: 'var-1', quantity: 1 }],
        shippingAddress: {
          recipientName: 'Fatima Noor',
          phoneNumber: '+923001234567',
          addressLine1: 'House 12, Street 4, Sector F-8/2',
          city: 'Islamabad',
          country: 'Pakistan',
        },
      });

      expect(result).toBeDefined();
      expect(result.orderNumber).toBe('ORD-202609-0001');
      expect(result.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(result.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(result.totalAmount).toEqual(new Prisma.Decimal(187500));
      expect(prismaService.order.create).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ORDER_CREATED_CATALOG',
          actorId: mockCustomerA.id,
        }),
      );
    });

    it('should reject order creation if variant stock is insufficient', async () => {
      prismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-low-stock',
        sku: 'KTQ-PESH-LOW',
        stockQuantity: 1, // Only 1 in stock!
        priceAdjustment: new Prisma.Decimal(0),
        isActive: true,
        product: { name: 'Limited Velvet Shawl', basePrice: new Prisma.Decimal(50000), isActive: true },
      });

      await expect(
        ordersService.createProductOrder(mockCustomerA.id, {
          items: [{ productVariantId: 'var-low-stock', quantity: 3 }], // Requesting 3
          shippingAddressId: 'addr-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Custom Quotation Order Integration', () => {
    it('should retrieve custom quotation order with customRequest link and PENDING_PAYMENT status', async () => {
      const mockCustomOrder = {
        id: 'order-custom-1',
        orderNumber: 'ORD-202609-0002',
        customerId: mockCustomerA.id,
        originCustomRequestId: 'req-bespoke-1',
        acceptedQuotationId: 'quote-v2',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: new Prisma.Decimal(250000),
        orderItems: [
          {
            id: 'item-custom-1',
            customRequestId: 'req-bespoke-1',
            itemTitle: 'Bespoke Zardozi Bridal Lehenga',
            unitPrice: new Prisma.Decimal(250000),
            quantity: 1,
            lineTotal: new Prisma.Decimal(250000),
          },
        ],
        originCustomRequest: {
          id: 'req-bespoke-1',
          requestNumber: 'CDR-202609-0001',
          status: 'QUOTE_ACCEPTED',
        },
        acceptedQuotation: {
          id: 'quote-v2',
          quoteNumber: 'QT-202609-0001-V2',
          versionNumber: 2,
        },
      };

      prismaService.order.findUnique.mockResolvedValue(mockCustomOrder);

      const order = await ordersService.getOrderById('order-custom-1', mockCustomerA);

      expect(order).toBeDefined();
      expect(order.originCustomRequestId).toBe('req-bespoke-1');
      expect(order.acceptedQuotationId).toBe('quote-v2');
      expect(order.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(order.orderItems.length).toBe(1);
    });
  });

  describe('3. Payment Pending (Initiation via Provider Abstraction)', () => {
    it('should initiate payment via provider abstraction and return transaction details', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-202609-0001',
        customerId: mockCustomerA.id,
        status: OrderStatus.PENDING_PAYMENT,
        totalAmount: new Prisma.Decimal(187500),
        currency: 'PKR',
        customer: mockCustomerA,
      };

      prismaService.order.findUnique.mockResolvedValue(mockOrder);
      prismaService.payment.create.mockResolvedValue({
        id: 'pay-1',
        orderId: 'order-1',
        transactionReference: 'TXN-MOCK-ORD-202609-0001-12345',
        paymentGateway: 'MOCK_GATEWAY',
        amount: new Prisma.Decimal(187500),
        status: PaymentStatus.PENDING,
      });

      const paymentSession = await paymentsService.initiatePayment('order-1', mockCustomerA, {
        paymentGateway: 'MOCK_GATEWAY',
      });

      expect(paymentSession).toBeDefined();
      expect(paymentSession.transactionReference).toBeDefined();
      expect(paymentSession.amount).toBe(187500);
      expect(prismaService.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'order-1',
            status: PaymentStatus.PENDING,
          }),
        }),
      );
    });
  });

  describe('4. Server-Side Successful Payment Verification', () => {
    it('should verify payment server-side, transition order to PAID, and deduct stock', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-202609-0001',
        customerId: mockCustomerA.id,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: new Prisma.Decimal(187500),
        orderItems: [{ productVariantId: 'var-1', quantity: 1 }],
      };

      const mockPendingPayment = {
        id: 'pay-1',
        orderId: 'order-1',
        transactionReference: 'TXN-MOCK-ORD-202609-0001-12345',
        paymentGateway: 'MOCK_GATEWAY',
        amount: new Prisma.Decimal(187500),
        status: PaymentStatus.PENDING,
      };

      prismaService.order.findUnique.mockResolvedValue(mockOrder);
      prismaService.payment.findUnique.mockResolvedValue(mockPendingPayment);

      prismaService.payment.update.mockResolvedValue({
        ...mockPendingPayment,
        status: PaymentStatus.CAPTURED,
        paidAt: new Date(),
      });

      prismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.CAPTURED,
        confirmedAt: new Date(),
      });

      const confirmation = await paymentsService.verifyPayment('order-1', mockCustomerA, {
        transactionReference: 'TXN-MOCK-ORD-202609-0001-12345',
        verificationPayload: { amount: 187500 },
      });

      expect(confirmation.success).toBe(true);
      expect(confirmation.status).toBe(OrderStatus.PAID);
      expect(prismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-1' },
          data: expect.objectContaining({ status: PaymentStatus.CAPTURED }),
        }),
      );
      expect(prismaService.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: expect.objectContaining({ status: OrderStatus.PAID }),
        }),
      );
      // Verify variant inventory deducted
      expect(prismaService.productVariant.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'var-1' },
          data: { stockQuantity: { decrement: 1 } },
        }),
      );
    });
  });

  describe('5. Failed Payment Handling', () => {
    it('should mark payment as FAILED and retain order in PENDING_PAYMENT status', async () => {
      const mockOrder = {
        id: 'order-1',
        customerId: mockCustomerA.id,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: new Prisma.Decimal(187500),
      };

      const mockPendingPayment = {
        id: 'pay-failed',
        orderId: 'order-1',
        transactionReference: 'TXN-FAIL-REF',
        paymentGateway: 'MOCK_GATEWAY',
        status: PaymentStatus.PENDING,
      };

      prismaService.order.findUnique.mockResolvedValue(mockOrder);
      prismaService.payment.findUnique.mockResolvedValue(mockPendingPayment);

      const failedResult = await paymentsService.verifyPayment('order-1', mockCustomerA, {
        transactionReference: 'TXN-FAIL-REF',
        verificationPayload: { simulateFailure: true, failureReason: 'Card expired or declined' },
      });

      expect(failedResult.success).toBe(false);
      expect(failedResult.status).toBe(PaymentStatus.FAILED);
      expect(failedResult.failureReason).toContain('Card expired or declined');

      expect(prismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-failed' },
          data: expect.objectContaining({ status: PaymentStatus.FAILED }),
        }),
      );

      // Order status must NOT become PAID!
      expect(prismaService.order.update).not.toHaveBeenCalled();
    });
  });

  describe('6. Duplicate Payment Callback (Idempotency Protection)', () => {
    it('should safely handle duplicate callbacks without double charging or throwing errors', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-202609-0001',
        customerId: mockCustomerA.id,
        status: OrderStatus.PAID, // Already paid!
        paymentStatus: PaymentStatus.CAPTURED,
        totalAmount: new Prisma.Decimal(187500),
      };

      const mockCapturedPayment = {
        id: 'pay-captured',
        orderId: 'order-1',
        transactionReference: 'TXN-DUPLICATE-REF',
        paymentGateway: 'MOCK_GATEWAY',
        status: PaymentStatus.CAPTURED, // Already captured!
      };

      prismaService.order.findUnique.mockResolvedValue(mockOrder);
      prismaService.payment.findUnique.mockResolvedValue(mockCapturedPayment);

      const duplicateResponse = await paymentsService.verifyPayment('order-1', mockCustomerA, {
        transactionReference: 'TXN-DUPLICATE-REF',
      });

      expect(duplicateResponse.idempotent).toBe(true);
      expect(duplicateResponse.success).toBe(true);
      expect(duplicateResponse.status).toBe(OrderStatus.PAID);

      // Verify no redundant database mutation
      expect(prismaService.payment.update).not.toHaveBeenCalled();
      expect(prismaService.order.update).not.toHaveBeenCalled();
    });
  });

  describe('7. Unauthorized Order Access & Customer Isolation Boundary', () => {
    it('Customer A must NEVER see Customer B order (Strict ForbiddenException)', async () => {
      const mockOrderCustomerB = {
        id: 'order-b-1',
        customerId: mockCustomerB.id, // belongs to Customer B
        status: OrderStatus.PAID,
      };

      prismaService.order.findUnique.mockResolvedValue(mockOrderCustomerB);

      // Customer A attempts to view Customer B's order
      await expect(ordersService.getOrderById('order-b-1', mockCustomerA)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('Customer A must NEVER be permitted to pay for Customer B order', async () => {
      const mockOrderCustomerB = {
        id: 'order-b-1',
        customerId: mockCustomerB.id,
        status: OrderStatus.PENDING_PAYMENT,
      };

      prismaService.order.findUnique.mockResolvedValue(mockOrderCustomerB);

      await expect(
        paymentsService.initiatePayment('order-b-1', mockCustomerA, { paymentGateway: 'MOCK_GATEWAY' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Customer listing must strictly scope orders to own customerId', async () => {
      prismaService.order.findMany.mockResolvedValue([
        { id: 'order-a-1', customerId: mockCustomerA.id },
      ]);

      await ordersService.listOrders(mockCustomerA);

      expect(prismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: mockCustomerA.id },
        }),
      );
    });

    it('Admin can access any customer order for management', async () => {
      const mockOrder = {
        id: 'order-any-1',
        customerId: mockCustomerB.id,
        status: OrderStatus.CONFIRMED,
      };

      prismaService.order.findUnique.mockResolvedValue(mockOrder);

      const adminView = await ordersService.getOrderById('order-any-1', mockAdmin);
      expect(adminView).toBeDefined();
      expect(adminView.id).toBe('order-any-1');
    });
  });

  describe('8. Luxury Order Tracking & Timeline', () => {
    it('should generate multi-stage tracking timeline (Placed, Paid, Production, QC, Dispatched)', async () => {
      const mockOrder = {
        id: 'order-track-1',
        orderNumber: 'ORD-202609-0001',
        customerId: mockCustomerA.id,
        status: OrderStatus.IN_PRODUCTION,
        paymentStatus: PaymentStatus.CAPTURED,
        totalAmount: new Prisma.Decimal(187500),
        currency: 'PKR',
        createdAt: new Date('2026-09-25'),
        confirmedAt: new Date('2026-09-26'),
        updatedAt: new Date('2026-09-27'),
        shippingAddress: { city: 'Lahore', country: 'Pakistan' },
        productionJobs: [],
        shipments: [],
      };

      prismaService.order.findUnique.mockResolvedValue(mockOrder);

      const tracking = await ordersService.getOrderTracking('order-track-1', mockCustomerA);

      expect(tracking.orderNumber).toBe('ORD-202609-0001');
      expect(tracking.timeline.find((t) => t.stage === 'ORDER_PLACED')?.isCompleted).toBe(true);
      expect(tracking.timeline.find((t) => t.stage === 'PAYMENT_VERIFIED')?.isCompleted).toBe(true);
      expect(tracking.timeline.find((t) => t.stage === 'IN_PRODUCTION')?.isCompleted).toBe(true);
      expect(tracking.timeline.find((t) => t.stage === 'SHIPPED')?.isCompleted).toBe(false);
    });
  });
});
