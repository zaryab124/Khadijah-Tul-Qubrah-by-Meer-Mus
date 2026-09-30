import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CampaignStatus, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

describe('CampaignsService (Phase 9 — Campaign Management & Attribution Engine)', () => {
  let service: CampaignsService;
  let prismaService: any;
  let auditService: any;

  const mockAdmin = {
    id: 'admin-1',
    role: 'ADMIN',
    email: 'admin@meermus.luxury',
  };

  const mockCampaign = {
    id: 'camp-1',
    name: 'Summer Luxury Lawn & Velvet Preview 2026',
    title: 'Summer Luxury Lawn & Velvet Preview 2026',
    platform: 'Instagram',
    campaignCode: 'SUMMER26',
    utmCampaign: 'SUMMER26',
    utmSource: 'meta_reels',
    utmMedium: 'cpc',
    budget: new Prisma.Decimal(250000),
    allocatedBudget: new Prisma.Decimal(250000),
    status: CampaignStatus.ACTIVE,
    startDate: new Date('2026-06-01T00:00:00.000Z'),
    endDate: new Date('2026-08-31T23:59:59.000Z'),
    description: 'Festive bespoke campaign for overseas Pakistani clients',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaService = {
      campaign: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      campaignPlatform: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. createCampaign', () => {
    it('should successfully create a new campaign with unique campaign_code and allocated budget', async () => {
      prismaService.campaign.findUnique.mockResolvedValue(null);
      prismaService.campaign.create.mockResolvedValue(mockCampaign);

      const dto = {
        name: 'Summer Luxury Lawn & Velvet Preview 2026',
        platform: 'Instagram',
        campaignCode: 'SUMMER26',
        budget: 250000,
        status: CampaignStatus.ACTIVE,
        description: 'Festive bespoke campaign',
      };

      const result = await service.createCampaign(dto, mockAdmin);

      expect(result).toBeDefined();
      expect(result.campaignCode).toBe('SUMMER26');
      expect(prismaService.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Summer Luxury Lawn & Velvet Preview 2026',
            campaignCode: 'SUMMER26',
            platform: 'Instagram',
            budget: expect.any(Prisma.Decimal),
            status: CampaignStatus.ACTIVE,
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAMPAIGN_CREATED',
          entityId: mockCampaign.id,
        }),
      );
    });

    it('should reject creation if campaignCode already exists with ConflictException', async () => {
      prismaService.campaign.findUnique.mockResolvedValue(mockCampaign);

      await expect(
        service.createCampaign(
          {
            name: 'Duplicate Code Campaign',
            platform: 'TikTok',
            campaignCode: 'SUMMER26',
            budget: 100000,
          },
          mockAdmin,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('2. updateCampaign', () => {
    it('should update campaign budget, dates and status', async () => {
      prismaService.campaign.findUnique.mockResolvedValue(mockCampaign);
      prismaService.campaign.update.mockResolvedValue({
        ...mockCampaign,
        budget: new Prisma.Decimal(350000),
        status: CampaignStatus.PAUSED,
      });

      const updated = await service.updateCampaign(
        mockCampaign.id,
        {
          budget: 350000,
          status: CampaignStatus.PAUSED,
        },
        mockAdmin,
      );

      expect(updated.budget).toEqual(new Prisma.Decimal(350000));
      expect(updated.status).toBe(CampaignStatus.PAUSED);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAMPAIGN_UPDATED',
        }),
      );
    });

    it('should throw NotFoundException if campaign to update does not exist', async () => {
      prismaService.campaign.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCampaign('non-existent', { budget: 50000 }, mockAdmin),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. getCampaignByCode (Link Attribution Resolution)', () => {
    it('should resolve active campaign code and return tracking payload with 30-day cookie window', async () => {
      const activeCampaignNoExpiry = {
        ...mockCampaign,
        startDate: null,
        endDate: null,
      };
      prismaService.campaign.findUnique.mockResolvedValue(activeCampaignNoExpiry);

      const result = await service.getCampaignByCode('summer26');

      expect(result).toBeDefined();
      expect(result.attribution.campaignId).toBe(mockCampaign.id);
      expect(result.attribution.campaignCode).toBe('SUMMER26');
      expect(result.clientTrackingPayload.cookieValue).toBe('SUMMER26');
      expect(result.clientTrackingPayload.maxAgeSeconds).toBe(2592000);
    });

    it('should throw NotFoundException if campaign code does not exist', async () => {
      prismaService.campaign.findUnique.mockResolvedValue(null);

      await expect(service.getCampaignByCode('UNKNOWN_CODE')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if campaign is PAUSED, DRAFT, or CANCELLED', async () => {
      prismaService.campaign.findUnique.mockResolvedValue({
        ...mockCampaign,
        status: CampaignStatus.PAUSED,
      });

      await expect(service.getCampaignByCode('SUMMER26')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('4. Configurable Platforms Management', () => {
    it('should list platforms and seed defaults if empty', async () => {
      prismaService.campaignPlatform.findMany
        .mockResolvedValueOnce([]) // initial query returns empty
        .mockResolvedValueOnce([
          { code: 'FACEBOOK', name: 'Facebook' },
          { code: 'INSTAGRAM', name: 'Instagram' },
          { code: 'TIKTOK', name: 'TikTok' },
          { code: 'WHATSAPP', name: 'WhatsApp' },
          { code: 'WEBSITE', name: 'Website' },
          { code: 'OTHER', name: 'Other' },
        ]);
      prismaService.campaignPlatform.upsert.mockResolvedValue({});

      const platforms = await service.listPlatforms();

      expect(platforms).toHaveLength(6);
      expect(prismaService.campaignPlatform.upsert).toHaveBeenCalledTimes(6);
    });

    it('should allow admin to configure a new advertising platform', async () => {
      prismaService.campaignPlatform.findUnique.mockResolvedValue(null);
      prismaService.campaignPlatform.create.mockResolvedValue({
        id: 'plat-1',
        code: 'PINTEREST',
        name: 'Pinterest Luxury',
        isActive: true,
      });

      const result = await service.createPlatform(
        {
          code: 'PINTEREST',
          name: 'Pinterest Luxury',
          description: 'Bridal inspiration moodboard pins',
        },
        mockAdmin,
      );

      expect(result.code).toBe('PINTEREST');
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PLATFORM_CONFIGURED',
        }),
      );
    });
  });

  describe('5. getCampaignAttributionAnalytics (Answers: Which campaign generated customer, orders, revenue?)', () => {
    it('should answer customer acquisition, generated orders, and compute real realized revenue & ROI', async () => {
      const mockCampaignWithAttribution = {
        ...mockCampaign,
        budget: new Prisma.Decimal(200000), // PKR 200,000 budget
        leads: [
          {
            id: 'lead-1',
            leadNumber: 'LED-202609-0001',
            leadSource: 'Instagram',
            status: 'CONVERTED',
            firstName: 'Amina',
            lastName: 'Tariq',
            contactPhone: '+923001234567',
            contactEmail: 'amina.t@example.com',
            estimatedValue: new Prisma.Decimal(450000),
            convertedAt: new Date(),
            createdAt: new Date(),
          },
          {
            id: 'lead-2',
            leadNumber: 'LED-202609-0002',
            leadSource: 'Instagram',
            status: 'NEW',
            firstName: 'Sara',
            lastName: 'Khan',
            contactPhone: '+923009876543',
            contactEmail: null,
            estimatedValue: null,
            convertedAt: null,
            createdAt: new Date(),
          },
        ],
        customers: [
          {
            userId: 'cust-1',
            createdAt: new Date(),
            user: {
              id: 'cust-1',
              firstName: 'Amina',
              lastName: 'Tariq',
              email: 'amina.t@example.com',
              phoneNumber: '+923001234567',
            },
          },
        ],
        customRequests: [
          {
            id: 'cr-1',
            requestNumber: 'CYO-202609-0001',
            status: 'CONVERTED_TO_ORDER',
            customerBudget: new Prisma.Decimal(450000),
            createdAt: new Date(),
            customer: { firstName: 'Amina', lastName: 'Tariq' },
          },
        ],
        orders: [
          {
            id: 'ord-1',
            orderNumber: 'ORD-202609-0001',
            status: OrderStatus.IN_PRODUCTION,
            paymentStatus: PaymentStatus.CAPTURED,
            totalAmount: new Prisma.Decimal(450000), // PKR 450,000 paid
            currency: 'PKR',
            confirmedAt: new Date(),
            createdAt: new Date(),
            customer: { firstName: 'Amina', lastName: 'Tariq', email: 'amina.t@example.com' },
          },
          {
            id: 'ord-2',
            orderNumber: 'ORD-202609-0002',
            status: OrderStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.PENDING,
            totalAmount: new Prisma.Decimal(180000), // Pending payment (not realized yet)
            currency: 'PKR',
            confirmedAt: null,
            createdAt: new Date(),
            customer: { firstName: 'Sara', lastName: 'Khan', email: 'sara.k@example.com' },
          },
        ],
      };

      prismaService.campaign.findUnique.mockResolvedValue(mockCampaignWithAttribution);

      const report = await service.getCampaignAttributionAnalytics(mockCampaign.id);

      expect(report).toBeDefined();

      // Q1: Which campaign generated this customer?
      expect(report.acquiredCustomers).toHaveLength(1);
      expect(report.acquiredCustomers[0].customerName).toBe('Amina Tariq');
      expect(report.acquiredCustomers[0].email).toBe('amina.t@example.com');

      // Q2: Which campaign generated orders?
      expect(report.ordersGenerated).toHaveLength(2);
      expect(report.performance.totalOrdersPlaced).toBe(2);
      expect(report.performance.paidOrdersCount).toBe(1);

      // Q3: Which campaign generated revenue?
      expect(report.performance.totalRealizedRevenue).toBe(450000); // Only captured / in-production order
      // Budget was 200,000, Revenue 450,000 => Net Profit 250,000 => ROI 125%
      expect(report.performance.netProfit).toBe(250000);
      expect(report.performance.roiPercentage).toBe(125);
      expect(report.performance.leadConversionRate).toBe(50); // 1 of 2 leads converted

      // Constraint: Do not claim advertising-platform metrics without live API integration
      expect(report.externalAdMetrics.integrated).toBe(false);
      expect(report.externalAdMetrics.note).toContain('Meta Marketing API / TikTok Ads API integration is not active');
    });
  });

  describe('6. getOverviewAnalytics (Multi-Campaign Leaderboard)', () => {
    it('should aggregate strategic campaign overview metrics across all campaigns', async () => {
      prismaService.campaign.findMany.mockResolvedValue([
        {
          id: 'camp-1',
          name: 'Summer Campaign',
          platform: 'Instagram',
          campaignCode: 'SUMMER26',
          status: CampaignStatus.ACTIVE,
          budget: new Prisma.Decimal(100000),
          leads: [{ id: 'l1', status: 'CONVERTED' }],
          customers: [{ userId: 'c1' }],
          orders: [
            {
              id: 'o1',
              totalAmount: new Prisma.Decimal(250000),
              status: OrderStatus.CONFIRMED,
              paymentStatus: PaymentStatus.CAPTURED,
            },
          ],
        },
      ]);

      const overview = await service.getOverviewAnalytics();

      expect(overview).toBeDefined();
      expect(overview.totals.totalCampaigns).toBe(1);
      expect(overview.totals.totalAllocatedBudget).toBe(100000);
      expect(overview.totals.totalRealizedRevenue).toBe(250000);
      expect(overview.totals.netProfit).toBe(150000);
      expect(overview.totals.overallRoiPercentage).toBe(150);
      expect(overview.campaigns).toHaveLength(1);
      expect(overview.disclaimer).toContain('No external platform metrics');
    });
  });
});
