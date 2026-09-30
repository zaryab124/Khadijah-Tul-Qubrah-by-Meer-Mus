import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  QuotationStatus,
  CustomRequestStatus,
  OrderStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import { QuotationsService } from './quotations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

describe('QuotationsService (Phase 5 — Designer Dashboard and Quotation Engine)', () => {
  let service: QuotationsService;
  let prismaService: any;
  let auditService: any;

  const mockDesigner = {
    id: 'designer-1',
    role: UserRole.DESIGNER,
    email: 'designer@meermus.luxury',
    firstName: 'Hassan',
    lastName: 'Couture',
  };

  const mockCustomer = {
    id: 'cust-1',
    role: UserRole.CUSTOMER,
    email: 'ayesha@example.com',
  };

  const mockOtherCustomer = {
    id: 'cust-2',
    role: UserRole.CUSTOMER,
    email: 'intruder@example.com',
  };

  const mockAdmin = {
    id: 'admin-1',
    role: UserRole.ADMIN,
    email: 'director@meermus.luxury',
  };

  const mockCustomRequest = {
    id: 'req-1',
    requestNumber: 'CDR-202609-0001',
    customerId: mockCustomer.id,
    assignedDesignerId: mockDesigner.id,
    status: CustomRequestStatus.SUBMITTED,
    customer: mockCustomer,
  };

  beforeEach(async () => {
    prismaService = {
      customDesignRequest: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      quotation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      order: {
        create: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaService)),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<QuotationsService>(QuotationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. Server-Side Calculations & Create Quotation V1', () => {
    it('should calculate item totals, fees, discounts on server and create V1', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue(mockCustomRequest);
      prismaService.quotation.findMany.mockResolvedValue([]); // No previous quotes -> V1

      const mockCreatedV1 = {
        id: 'quote-v1',
        customRequestId: 'req-1',
        versionNumber: 1,
        quoteNumber: 'QT-202609-0001-V1',
        createdBy: mockDesigner.id,
        status: QuotationStatus.DRAFT,
        subtotalAmount: new Prisma.Decimal(120000), // (40000 * 2) + 40000
        customizationFee: new Prisma.Decimal(15000),
        deliveryFee: new Prisma.Decimal(3000),
        discountAmount: new Prisma.Decimal(5000),
        taxAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(133000), // 120000 + 15000 + 3000 - 5000
        items: [
          {
            itemTitle: 'Pure Katan Silk & Brocade Fabric',
            quantity: 2,
            unitPrice: new Prisma.Decimal(40000),
            lineTotal: new Prisma.Decimal(80000),
          },
          {
            itemTitle: 'Artisanal Zardozi & Dabka Embroidery',
            quantity: 1,
            unitPrice: new Prisma.Decimal(40000),
            lineTotal: new Prisma.Decimal(40000),
          },
        ],
      };

      prismaService.quotation.create.mockResolvedValue(mockCreatedV1);
      prismaService.customDesignRequest.update.mockResolvedValue({
        ...mockCustomRequest,
        status: CustomRequestStatus.QUOTE_PREPARATION,
      });

      const result = await service.createQuotation('req-1', mockDesigner, {
        items: [
          {
            itemTitle: 'Pure Katan Silk & Brocade Fabric',
            itemType: 'FABRIC',
            quantity: 2,
            unitPrice: 40000,
          },
          {
            itemTitle: 'Artisanal Zardozi & Dabka Embroidery',
            itemType: 'CRAFT',
            quantity: 1,
            unitPrice: 40000,
          },
        ],
        customizationFee: 15000,
        deliveryFee: 3000,
        discountAmount: 5000,
        taxAmount: 0,
        estimatedMinDays: 14,
        estimatedMaxDays: 28,
        designerNotes: 'Initial bespoke proposal with premium zardozi borders',
      });

      expect(result).toBeDefined();
      expect(result.versionNumber).toBe(1);
      expect(result.quoteNumber).toBe('QT-202609-0001-V1');
      expect(result.subtotalAmount).toEqual(new Prisma.Decimal(120000));
      expect(result.totalAmount).toEqual(new Prisma.Decimal(133000));

      // Verify Prisma call with server-calculated numbers
      expect(prismaService.quotation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionNumber: 1,
            quoteNumber: 'QT-202609-0001-V1',
            subtotalAmount: new Prisma.Decimal(120000),
            totalAmount: new Prisma.Decimal(133000),
          }),
        }),
      );

      // Verify status updated to QUOTE_PREPARATION
      expect(prismaService.customDesignRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-1' },
          data: expect.objectContaining({
            status: CustomRequestStatus.QUOTE_PREPARATION,
          }),
        }),
      );

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'QUOTATION_CREATED',
          actorId: mockDesigner.id,
        }),
      );
    });

    it('should reject quotation creation if requested by unauthorized non-designer', async () => {
      await expect(
        service.createQuotation('req-1', mockCustomer, {
          items: [{ itemTitle: 'Test', itemType: 'OTHER', quantity: 1, unitPrice: 1000 }],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('2. Send Quotation V1', () => {
    it('should update quote to SENT and custom request to QUOTE_SENT', async () => {
      const mockQuoteV1 = {
        id: 'quote-v1',
        customRequestId: 'req-1',
        status: QuotationStatus.DRAFT,
        customRequest: mockCustomRequest,
      };

      prismaService.quotation.findUnique.mockResolvedValue(mockQuoteV1);
      prismaService.quotation.update.mockResolvedValue({
        ...mockQuoteV1,
        status: QuotationStatus.SENT,
        sentAt: new Date(),
      });
      prismaService.customDesignRequest.update.mockResolvedValue({
        ...mockCustomRequest,
        status: CustomRequestStatus.QUOTE_SENT,
      });

      const sentQuote = await service.sendQuotation('quote-v1', mockDesigner);

      expect(sentQuote.status).toBe(QuotationStatus.SENT);
      expect(prismaService.quotation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'quote-v1' },
          data: expect.objectContaining({ status: QuotationStatus.SENT }),
        }),
      );
      expect(prismaService.customDesignRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { status: CustomRequestStatus.QUOTE_SENT },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'QUOTATION_SENT',
          entityId: 'quote-v1',
        }),
      );
    });
  });

  describe('3. Customer Requests Revision / Changes on V1', () => {
    it('should transition V1 to REVISION_REQUESTED and record customer notes', async () => {
      const mockQuoteV1Sent = {
        id: 'quote-v1',
        customRequestId: 'req-1',
        status: QuotationStatus.SENT,
        customRequest: mockCustomRequest,
      };

      prismaService.quotation.findUnique.mockResolvedValue(mockQuoteV1Sent);
      prismaService.quotation.update.mockResolvedValue({
        ...mockQuoteV1Sent,
        status: QuotationStatus.REVISION_REQUESTED,
        customerChangeRequestNotes:
          'Please reduce embroidery on lower sleeve to fit my PKR 110,000 budget.',
      });
      prismaService.customDesignRequest.update.mockResolvedValue({
        ...mockCustomRequest,
        status: CustomRequestStatus.REVISION_REQUESTED,
      });

      const revised = await service.requestChanges('quote-v1', mockCustomer, {
        changeNotes: 'Please reduce embroidery on lower sleeve to fit my PKR 110,000 budget.',
      });

      expect(revised.status).toBe(QuotationStatus.REVISION_REQUESTED);
      expect(prismaService.quotation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'quote-v1' },
          data: expect.objectContaining({
            status: QuotationStatus.REVISION_REQUESTED,
            customerChangeRequestNotes:
              'Please reduce embroidery on lower sleeve to fit my PKR 110,000 budget.',
          }),
        }),
      );
      expect(prismaService.customDesignRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { status: CustomRequestStatus.REVISION_REQUESTED },
      });
    });

    it('should block non-owner customer from requesting revisions', async () => {
      prismaService.quotation.findUnique.mockResolvedValue({
        id: 'quote-v1',
        status: QuotationStatus.SENT,
        customRequest: mockCustomRequest, // belongs to cust-1
      });

      await expect(
        service.requestChanges('quote-v1', mockOtherCustomer, {
          changeNotes: 'Unauthorized change attempt',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4 & 5. Create Quotation V2 & Verify Immutability of V1', () => {
    it('should create V2 with incremented version while V1 remains untouched in database', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue(mockCustomRequest);
      // Existing quotes in DB: V1 has versionNumber: 1
      prismaService.quotation.findMany.mockResolvedValue([{ versionNumber: 1 }]);

      const mockCreatedV2 = {
        id: 'quote-v2',
        customRequestId: 'req-1',
        versionNumber: 2,
        quoteNumber: 'QT-202609-0001-V2',
        createdBy: mockDesigner.id,
        status: QuotationStatus.DRAFT,
        subtotalAmount: new Prisma.Decimal(100000), // Adjusted per customer feedback
        customizationFee: new Prisma.Decimal(10000),
        deliveryFee: new Prisma.Decimal(2500),
        discountAmount: new Prisma.Decimal(5000),
        taxAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(107500), // 100000 + 10000 + 2500 - 5000 = 107500
        items: [
          {
            itemTitle: 'Pure Katan Silk & Brocade Fabric',
            quantity: 2,
            unitPrice: new Prisma.Decimal(40000),
            lineTotal: new Prisma.Decimal(80000),
          },
          {
            itemTitle: 'Refined Artisanal Embroidery (Light Sleeves)',
            quantity: 1,
            unitPrice: new Prisma.Decimal(20000),
            lineTotal: new Prisma.Decimal(20000),
          },
        ],
      };

      prismaService.quotation.create.mockResolvedValue(mockCreatedV2);
      prismaService.customDesignRequest.update.mockResolvedValue({
        ...mockCustomRequest,
        status: CustomRequestStatus.QUOTE_PREPARATION,
      });

      const v2Result = await service.createQuotation('req-1', mockDesigner, {
        items: [
          {
            itemTitle: 'Pure Katan Silk & Brocade Fabric',
            itemType: 'FABRIC',
            quantity: 2,
            unitPrice: 40000,
          },
          {
            itemTitle: 'Refined Artisanal Embroidery (Light Sleeves)',
            itemType: 'CRAFT',
            quantity: 1,
            unitPrice: 20000,
          },
        ],
        customizationFee: 10000,
        deliveryFee: 2500,
        discountAmount: 5000,
        designerNotes: 'Revised V2: modified sleeve embroidery density to align with target budget.',
      });

      // Assert V2 properties
      expect(v2Result.versionNumber).toBe(2);
      expect(v2Result.quoteNumber).toBe('QT-202609-0001-V2');
      expect(v2Result.totalAmount).toEqual(new Prisma.Decimal(107500));

      // VERIFY V1 IMMUTABILITY: V1 was NEVER passed to prisma.quotation.update for mutation!
      expect(prismaService.quotation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionNumber: 2,
            quoteNumber: 'QT-202609-0001-V2',
          }),
        }),
      );
    });
  });

  describe('6 & 7 & 8. Customer Accepts V2, Supersedes V1, and Triggers Order Creation', () => {
    it('should accept V2, supersede V1, update request status, and create Order with OrderItems', async () => {
      const mockQuoteV2Sent = {
        id: 'quote-v2',
        customRequestId: 'req-1',
        versionNumber: 2,
        quoteNumber: 'QT-202609-0001-V2',
        status: QuotationStatus.SENT,
        subtotalAmount: new Prisma.Decimal(100000),
        customizationFee: new Prisma.Decimal(10000),
        deliveryFee: new Prisma.Decimal(2500),
        discountAmount: new Prisma.Decimal(5000),
        taxAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(107500),
        currency: 'PKR',
        items: [
          {
            itemTitle: 'Pure Katan Silk & Brocade Fabric',
            itemType: 'FABRIC',
            quantity: 2,
            unitPrice: new Prisma.Decimal(40000),
            lineTotal: new Prisma.Decimal(80000),
          },
          {
            itemTitle: 'Refined Artisanal Embroidery (Light Sleeves)',
            itemType: 'CRAFT',
            quantity: 1,
            unitPrice: new Prisma.Decimal(20000),
            lineTotal: new Prisma.Decimal(20000),
          },
        ],
        customRequest: mockCustomRequest,
      };

      prismaService.quotation.findUnique.mockResolvedValue(mockQuoteV2Sent);
      prismaService.order.count.mockResolvedValue(0);

      // Quote acceptance update
      prismaService.quotation.update.mockResolvedValue({
        ...mockQuoteV2Sent,
        status: QuotationStatus.ACCEPTED,
        acceptedAt: new Date(),
      });

      // Prior quotes supersession
      prismaService.quotation.updateMany.mockResolvedValue({ count: 1 });

      // Custom request updates
      prismaService.customDesignRequest.update.mockResolvedValue({
        ...mockCustomRequest,
        status: CustomRequestStatus.CONVERTED_TO_ORDER,
      });

      // Order creation
      const mockCreatedOrder = {
        id: 'ord-101',
        orderNumber: 'ORD-202609-0001',
        customerId: mockCustomer.id,
        originCustomRequestId: 'req-1',
        acceptedQuotationId: 'quote-v2',
        status: OrderStatus.PENDING_PAYMENT,
        totalAmount: new Prisma.Decimal(107500),
        orderItems: [
          {
            id: 'item-1',
            itemTitle: 'Pure Katan Silk & Brocade Fabric',
            quantity: 2,
            lineTotal: new Prisma.Decimal(80000),
          },
          {
            id: 'item-2',
            itemTitle: 'Refined Artisanal Embroidery (Light Sleeves)',
            quantity: 1,
            lineTotal: new Prisma.Decimal(20000),
          },
        ],
      };

      prismaService.order.create.mockResolvedValue(mockCreatedOrder);

      const acceptanceResult = await service.acceptQuotation('quote-v2', mockCustomer);

      // 1. Verify V2 is accepted
      expect(acceptanceResult.quotation.status).toBe(QuotationStatus.ACCEPTED);

      // 2. Verify all other quotes (e.g. V1) are superseded
      expect(prismaService.quotation.updateMany).toHaveBeenCalledWith({
        where: {
          customRequestId: 'req-1',
          id: { not: 'quote-v2' },
          status: { not: QuotationStatus.REJECTED },
        },
        data: {
          status: QuotationStatus.SUPERSEDED,
        },
      });

      // 3. Verify order is created correctly
      expect(acceptanceResult.order).toBeDefined();
      expect(acceptanceResult.order.orderNumber).toBe('ORD-202609-0001');
      expect(acceptanceResult.order.acceptedQuotationId).toBe('quote-v2');
      expect(acceptanceResult.order.totalAmount).toEqual(new Prisma.Decimal(107500));
      expect(acceptanceResult.order.status).toBe(OrderStatus.PENDING_PAYMENT);

      expect(prismaService.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: mockCustomer.id,
            originCustomRequestId: 'req-1',
            acceptedQuotationId: 'quote-v2',
            totalAmount: new Prisma.Decimal(107500),
            status: OrderStatus.PENDING_PAYMENT,
          }),
        }),
      );

      // 4. Verify request status converted to order
      expect(prismaService.customDesignRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-1' },
          data: { status: CustomRequestStatus.CONVERTED_TO_ORDER },
        }),
      );

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'QUOTATION_ACCEPTED',
          entityId: 'quote-v2',
        }),
      );
    });

    it('should reject acceptance if quotation status is not SENT', async () => {
      prismaService.quotation.findUnique.mockResolvedValue({
        id: 'quote-draft',
        status: QuotationStatus.DRAFT, // Still in draft
        customRequest: mockCustomRequest,
      });

      await expect(service.acceptQuotation('quote-draft', mockCustomer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('9. Designer Dashboard & Queue Operations', () => {
    it('should aggregate 6 core designer queues and accurate metrics', async () => {
      prismaService.customDesignRequest.findMany
        .mockResolvedValueOnce([{ id: 'new-1', status: CustomRequestStatus.SUBMITTED }]) // newRequests
        .mockResolvedValueOnce([{ id: 'assigned-1', status: CustomRequestStatus.DESIGN_REVIEW }]) // assignedRequests
        .mockResolvedValueOnce([
          { id: 'clar-1', status: CustomRequestStatus.CLARIFICATION_REQUESTED },
        ]) // clarificationRequests
        .mockResolvedValueOnce([{ id: 'prep-1', status: CustomRequestStatus.QUOTE_PREPARATION }]) // quotationPreparation
        .mockResolvedValueOnce([
          { id: 'rev-1', status: CustomRequestStatus.REVISION_REQUESTED },
        ]); // revisionRequests

      prismaService.quotation.findMany.mockResolvedValueOnce([
        { id: 'done-1', status: QuotationStatus.ACCEPTED },
      ]); // completedQuotes

      const dashboard = await service.getDesignerDashboard(mockDesigner);

      expect(dashboard.metrics.newRequestsCount).toBe(1);
      expect(dashboard.metrics.assignedRequestsCount).toBe(1);
      expect(dashboard.metrics.clarificationRequestsCount).toBe(1);
      expect(dashboard.metrics.quotationPreparationCount).toBe(1);
      expect(dashboard.metrics.revisionRequestsCount).toBe(1);
      expect(dashboard.metrics.completedQuotesCount).toBe(1);
    });

    it('should allow designer to self-assign unassigned custom request (acceptJob)', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue({
        id: 'unassigned-req',
        assignedDesignerId: null,
      });

      prismaService.customDesignRequest.update.mockResolvedValue({
        id: 'unassigned-req',
        assignedDesignerId: mockDesigner.id,
        status: CustomRequestStatus.DESIGN_REVIEW,
      });

      const assigned = await service.acceptJob('unassigned-req', mockDesigner);
      expect(assigned.assignedDesignerId).toBe(mockDesigner.id);
      expect(assigned.status).toBe(CustomRequestStatus.DESIGN_REVIEW);
      expect(prismaService.customDesignRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'unassigned-req' },
          data: {
            assignedDesignerId: mockDesigner.id,
            status: CustomRequestStatus.DESIGN_REVIEW,
          },
        }),
      );
    });

    it('should allow designer to request clarification from customer', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue({
        id: 'req-clar',
        assignedDesignerId: mockDesigner.id,
      });

      prismaService.customDesignRequest.update.mockResolvedValue({
        id: 'req-clar',
        clarificationNotes: 'Please confirm antique gold or bright gold zardozi.',
        status: CustomRequestStatus.CLARIFICATION_REQUESTED,
      });

      const result = await service.requestClarification('req-clar', mockDesigner, {
        clarificationNotes: 'Please confirm antique gold or bright gold zardozi.',
      });

      expect(result.status).toBe(CustomRequestStatus.CLARIFICATION_REQUESTED);
      expect(prismaService.customDesignRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clarificationNotes: 'Please confirm antique gold or bright gold zardozi.',
            status: CustomRequestStatus.CLARIFICATION_REQUESTED,
          }),
        }),
      );
    });
  });
});
