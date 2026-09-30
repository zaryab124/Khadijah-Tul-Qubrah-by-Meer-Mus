import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, LeadStatus, QuotationStatus, ProductionStatus } from '@prisma/client';

describe('AnalyticsService (Phase 12 — Verified Business Analytics)', () => {
  let service: AnalyticsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      customDesignRequest: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      quotation: {
        count: jest.fn(),
      },
      lead: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      leadActivity: {
        count: jest.fn(),
      },
      campaign: {
        findMany: jest.fn(),
      },
      productionJob: {
        count: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('Customer Analytics', () => {
    it('should accurately calculate new vs returning customers and repeat customer rate', async () => {
      prisma.user.count.mockResolvedValue(100); // 100 registered customers
      // Grouping orders by customer:
      // Customer 1: 1 order (new)
      // Customer 2: 3 orders (returning)
      // Customer 3: 2 orders (returning)
      // Customer 4: 1 order (new)
      prisma.order.groupBy.mockResolvedValue([
        { customerId: 'c1', _count: { id: 1 } },
        { customerId: 'c2', _count: { id: 3 } },
        { customerId: 'c3', _count: { id: 2 } },
        { customerId: 'c4', _count: { id: 1 } },
      ]);

      const result = await service.getCustomerAnalytics();

      expect(result.totalRegisteredCustomers).toBe(100);
      expect(result.orderingCustomersCount).toBe(4);
      expect(result.newCustomers).toBe(2);
      expect(result.returningCustomers).toBe(2);
      expect(result.repeatCustomerRate).toBe(50.0); // 2 out of 4 = 50%
    });
  });

  describe('Sales Analytics (Daily, Weekly, Monthly)', () => {
    it('should aggregate sales time-series across daily, weekly and monthly intervals', async () => {
      const mockOrders = [
        { id: 'o-1', totalAmount: 300000, createdAt: new Date('2026-09-01T10:00:00Z') },
        { id: 'o-2', totalAmount: 200000, createdAt: new Date('2026-09-01T14:00:00Z') },
        { id: 'o-3', totalAmount: 500000, createdAt: new Date('2026-09-10T12:00:00Z') },
      ];
      prisma.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getSalesAnalytics();

      expect(result.totalSales).toBe(1000000);
      expect(result.totalOrdersCount).toBe(3);
      expect(result.averageOrderValue).toBe(333333.33);
      expect(result.daily.find((d) => d.date === '2026-09-01')?.sales).toBe(500000);
      expect(result.daily.find((d) => d.date === '2026-09-01')?.ordersCount).toBe(2);
      expect(result.monthly.find((m) => m.month === '2026-09')?.sales).toBe(1000000);
    });
  });

  describe('Custom Design Studio Analytics', () => {
    it('should compute bespoke requests, quotes, acceptance and conversion rate', async () => {
      prisma.customDesignRequest.count.mockResolvedValue(40);
      prisma.customDesignRequest.groupBy.mockResolvedValue([
        { status: 'SUBMITTED', _count: { id: 15 } },
        { status: 'QUOTE_ACCEPTED', _count: { id: 25 } },
      ]);
      prisma.quotation.count
        .mockResolvedValueOnce(30) // totalQuotes
        .mockResolvedValueOnce(20) // acceptedQuotes
        .mockResolvedValueOnce(5); // rejectedQuotes
      prisma.order.count.mockResolvedValue(18); // convertedToOrders

      const result = await service.getCustomDesignAnalytics();

      expect(result.totalRequests).toBe(40);
      expect(result.requestsByStatus.SUBMITTED).toBe(15);
      expect(result.totalQuotes).toBe(30);
      expect(result.acceptedQuotes).toBe(20);
      expect(result.rejectedQuotes).toBe(5);
      expect(result.conversionRate).toBe(66.7); // 20 / 30 = 66.7%
      expect(result.conversionFunnel.convertedToOrders).toBe(18);
    });
  });

  describe('CRM Analytics', () => {
    it('should aggregate leads by status, sources, and agent activities/conversions', async () => {
      prisma.lead.count.mockResolvedValue(50);
      prisma.lead.groupBy
        .mockResolvedValueOnce([
          { status: 'NEW', _count: { id: 20 } },
          { status: 'CONVERTED', _count: { id: 30 } },
        ])
        .mockResolvedValueOnce([
          { leadSource: 'Instagram', _count: { id: 35 }, _sum: { estimatedValue: 5000000 } },
          { leadSource: 'WhatsApp', _count: { id: 15 }, _sum: { estimatedValue: 2000000 } },
        ]);
      prisma.leadActivity.count.mockResolvedValue(120);
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'agent-1',
          firstName: 'Fatima',
          lastName: 'Bibi',
          email: 'fatima@meermus.luxury',
          assignedLeads: [
            { id: 'l1', status: LeadStatus.CONVERTED },
            { id: 'l2', status: LeadStatus.ASSIGNED },
          ],
          leadActivities: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }],
        },
      ]);

      const result = await service.getCrmAnalytics();

      expect(result.totalLeads).toBe(50);
      expect(result.leadsByStatus.CONVERTED).toBe(30);
      expect(result.leadSources.find((s) => s.source === 'Instagram')?.count).toBe(35);
      expect(result.agentActivity.totalActivitiesLogged).toBe(120);
      expect(result.agentActivity.breakdown[0].activitiesCount).toBe(3);
      expect(result.agentConversions[0].conversionRate).toBe(50.0);
    });
  });

  describe('Campaign Analytics & Provenance Distinction', () => {
    it('should calculate actual database campaign attribution and include ad metrics disclaimer', async () => {
      prisma.campaign.findMany.mockResolvedValue([
        {
          id: 'camp-1',
          name: 'Summer Bridal 2026',
          campaignCode: 'SUMMER26',
          platform: 'Instagram',
          budget: 200000,
          status: 'ACTIVE',
          leads: [{ id: 'l1' }, { id: 'l2' }],
          orders: [
            { id: 'o1', totalAmount: 450000 },
            { id: 'o2', totalAmount: 350000 },
          ],
        },
      ]);

      const result = await service.getCampaignAnalytics();

      expect(result.metricsProvenance).toBe('ACTUAL_DATABASE_METRICS');
      expect(result.externalAdMetricsDisclaimer).toContain('All reporting reflects actual internal PostgreSQL');
      expect(result.campaigns[0].leadsCount).toBe(2);
      expect(result.campaigns[0].ordersCount).toBe(2);
      expect(result.campaigns[0].revenueGenerated).toBe(800000);
      // ROI: ((800000 - 200000) / 200000) * 100 = 300%
      expect(result.campaigns[0].realizedRoiPercentage).toBe(300.0);
      expect(result.totalAttributedRevenue).toBe(800000);
    });
  });

  describe('Production Analytics', () => {
    it('should compute pending, completed, delayed jobs, and average production duration', async () => {
      prisma.productionJob.count
        .mockResolvedValueOnce(15) // pendingJobsCount
        .mockResolvedValueOnce(20) // completedJobsCount
        .mockResolvedValueOnce(3); // delayedJobsCount

      // Completed jobs with 10 days and 20 days duration
      const createdAt1 = new Date('2026-08-01');
      const completedAt1 = new Date('2026-08-11'); // 10 days
      const createdAt2 = new Date('2026-08-01');
      const completedAt2 = new Date('2026-08-21'); // 20 days

      prisma.productionJob.findMany.mockResolvedValue([
        { createdAt: createdAt1, actualCompletionDate: completedAt1 },
        { createdAt: createdAt2, actualCompletionDate: completedAt2 },
      ]);

      prisma.productionJob.groupBy.mockResolvedValue([
        { status: 'CUTTING', _count: { id: 5 } },
        { status: 'STITCHING', _count: { id: 6 } },
        { status: 'COMPLETED', _count: { id: 20 } },
      ]);

      const result = await service.getProductionAnalytics();

      expect(result.pendingJobs).toBe(15);
      expect(result.completedJobs).toBe(20);
      expect(result.delayedJobs).toBe(3);
      // Average: (10 + 20) / 2 = 15.0 days
      expect(result.averageProductionDays).toBe(15.0);
      expect(result.jobsByStage.CUTTING).toBe(5);
    });
  });

  describe('Master Unified Business Report', () => {
    it('should compile the full multi-domain business report', async () => {
      // Mock minimal responses for all sub-calls
      prisma.user.count.mockResolvedValue(10);
      prisma.order.groupBy.mockResolvedValue([]);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.customDesignRequest.count.mockResolvedValue(0);
      prisma.customDesignRequest.groupBy.mockResolvedValue([]);
      prisma.quotation.count.mockResolvedValue(0);
      prisma.order.count.mockResolvedValue(0);
      prisma.lead.count.mockResolvedValue(0);
      prisma.lead.groupBy.mockResolvedValue([]);
      prisma.leadActivity.count.mockResolvedValue(0);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.campaign.findMany.mockResolvedValue([]);
      prisma.productionJob.count.mockResolvedValue(0);
      prisma.productionJob.findMany.mockResolvedValue([]);
      prisma.productionJob.groupBy.mockResolvedValue([]);

      const report = await service.getFullBusinessReport();

      expect(report.provenance).toBe('ACTUAL_DATABASE_METRICS');
      expect(report).toHaveProperty('customers');
      expect(report).toHaveProperty('sales');
      expect(report).toHaveProperty('customDesign');
      expect(report).toHaveProperty('crm');
      expect(report).toHaveProperty('campaign');
      expect(report).toHaveProperty('production');
    });
  });
});
