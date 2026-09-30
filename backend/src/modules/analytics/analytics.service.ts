import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, LeadStatus, QuotationStatus, ProductionStatus } from '@prisma/client';

export interface CustomerAnalyticsResult {
  totalRegisteredCustomers: number;
  orderingCustomersCount: number;
  newCustomers: number; // Customers with exactly 1 order
  returningCustomers: number; // Customers with > 1 order
  repeatCustomerRate: number; // Percentage of ordering customers who returned
}

export interface SalesAnalyticsResult {
  totalSales: number;
  totalSalesFormatted: string;
  totalOrdersCount: number;
  averageOrderValue: number;
  daily: Array<{ date: string; sales: number; ordersCount: number }>;
  weekly: Array<{ week: string; sales: number; ordersCount: number }>;
  monthly: Array<{ month: string; sales: number; ordersCount: number }>;
}

export interface CustomDesignAnalyticsResult {
  totalRequests: number;
  requestsByStatus: Record<string, number>;
  totalQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  conversionRate: number;
  conversionFunnel: {
    inquiriesSubmitted: number;
    quotationsFormulated: number;
    quotationsAccepted: number;
    convertedToOrders: number;
  };
}

export interface CrmAnalyticsResult {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  leadSources: Array<{ source: string; count: number; estimatedValue: number }>;
  agentActivity: {
    totalActivitiesLogged: number;
    breakdown: Array<{ agentId: string; agentName: string; activitiesCount: number }>;
  };
  agentConversions: Array<{
    agentId: string;
    agentName: string;
    assignedLeadsCount: number;
    convertedLeadsCount: number;
    conversionRate: number;
  }>;
}

export interface CampaignAnalyticsResult {
  metricsProvenance: 'ACTUAL_DATABASE_METRICS';
  externalAdMetricsDisclaimer: string;
  campaigns: Array<{
    id: string;
    name: string;
    campaignCode: string;
    platform: string;
    budget: number;
    status: string;
    leadsCount: number;
    ordersCount: number;
    revenueGenerated: number;
    realizedRoiPercentage: number;
  }>;
  totalAttributedRevenue: number;
  totalAttributedOrders: number;
  totalAttributedLeads: number;
}

export interface ProductionAnalyticsResult {
  pendingJobs: number;
  completedJobs: number;
  delayedJobs: number;
  averageProductionDays: number;
  jobsByStage: Record<string, number>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  // Statuses considered realized sales / confirmed orders
  private readonly paidStatuses: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.IN_PRODUCTION,
    OrderStatus.QUALITY_CHECK,
    OrderStatus.READY_TO_SHIP,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Customer Analytics (Actual DB Data)
   */
  async getCustomerAnalytics(): Promise<CustomerAnalyticsResult> {
    this.logger.log('Computing customer analytics from database');

    const totalRegisteredCustomers = await this.prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // Group orders by customerId for paid/confirmed orders
    const customerOrderGroups = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: {
        status: { in: this.paidStatuses },
      },
      _count: {
        id: true,
      },
    });

    const orderingCustomersCount = customerOrderGroups.length;
    let newCustomers = 0;
    let returningCustomers = 0;

    for (const group of customerOrderGroups) {
      if (group._count.id === 1) {
        newCustomers++;
      } else if (group._count.id > 1) {
        returningCustomers++;
      }
    }

    const repeatCustomerRate =
      orderingCustomersCount > 0
        ? Number(((returningCustomers / orderingCustomersCount) * 100).toFixed(1))
        : 0;

    return {
      totalRegisteredCustomers,
      orderingCustomersCount,
      newCustomers,
      returningCustomers,
      repeatCustomerRate,
    };
  }

  /**
   * 2. Sales Analytics (Daily, Weekly, Monthly from DB)
   */
  async getSalesAnalytics(): Promise<SalesAnalyticsResult> {
    this.logger.log('Computing time-series sales analytics from database');

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: this.paidStatuses },
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalSales = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalOrdersCount = orders.length;
    const averageOrderValue =
      totalOrdersCount > 0 ? Number((totalSales / totalOrdersCount).toFixed(2)) : 0;

    // Aggregate Daily (last 30 intervals)
    const dailyMap = new Map<string, { sales: number; count: number }>();
    // Aggregate Weekly
    const weeklyMap = new Map<string, { sales: number; count: number }>();
    // Aggregate Monthly
    const monthlyMap = new Map<string, { sales: number; count: number }>();

    for (const o of orders) {
      const d = new Date(o.createdAt);
      const amount = Number(o.totalAmount || 0);

      // YYYY-MM-DD
      const dateKey = d.toISOString().split('T')[0];
      const curDaily = dailyMap.get(dateKey) || { sales: 0, count: 0 };
      dailyMap.set(dateKey, { sales: curDaily.sales + amount, count: curDaily.count + 1 });

      // YYYY-Wxx (ISO week)
      const weekKey = this.getYearWeekString(d);
      const curWeekly = weeklyMap.get(weekKey) || { sales: 0, count: 0 };
      weeklyMap.set(weekKey, { sales: curWeekly.sales + amount, count: curWeekly.count + 1 });

      // YYYY-MM
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const curMonthly = monthlyMap.get(monthKey) || { sales: 0, count: 0 };
      monthlyMap.set(monthKey, { sales: curMonthly.sales + amount, count: curMonthly.count + 1 });
    }

    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      ordersCount: data.count,
    }));

    const weekly = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      sales: data.sales,
      ordersCount: data.count,
    }));

    const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      sales: data.sales,
      ordersCount: data.count,
    }));

    return {
      totalSales,
      totalSalesFormatted: `PKR ${totalSales.toLocaleString('en-PK')}`,
      totalOrdersCount,
      averageOrderValue,
      daily,
      weekly,
      monthly,
    };
  }

  /**
   * 3. Custom Design Analytics (Requests, Quotes, Acceptance, Conversion)
   */
  async getCustomDesignAnalytics(): Promise<CustomDesignAnalyticsResult> {
    this.logger.log('Computing custom design studio analytics from database');

    const [
      totalRequests,
      requestsByStatusGroup,
      totalQuotes,
      acceptedQuotes,
      rejectedQuotes,
      convertedToOrders,
    ] = await Promise.all([
      this.prisma.customDesignRequest.count(),
      this.prisma.customDesignRequest.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.quotation.count(),
      this.prisma.quotation.count({ where: { status: QuotationStatus.ACCEPTED } }),
      this.prisma.quotation.count({ where: { status: QuotationStatus.REJECTED } }),
      this.prisma.order.count({ where: { originCustomRequestId: { not: null } } }),
    ]);

    const requestsByStatus: Record<string, number> = {};
    for (const group of requestsByStatusGroup) {
      requestsByStatus[group.status] = group._count.id;
    }

    const conversionRate =
      totalQuotes > 0 ? Number(((acceptedQuotes / totalQuotes) * 100).toFixed(1)) : 0;

    return {
      totalRequests,
      requestsByStatus,
      totalQuotes,
      acceptedQuotes,
      rejectedQuotes,
      conversionRate,
      conversionFunnel: {
        inquiriesSubmitted: totalRequests,
        quotationsFormulated: totalQuotes,
        quotationsAccepted: acceptedQuotes,
        convertedToOrders,
      },
    };
  }

  /**
   * 4. CRM Analytics (Leads, Sources, Agent Activities, Agent Conversions)
   */
  async getCrmAnalytics(): Promise<CrmAnalyticsResult> {
    this.logger.log('Computing CRM and sales agent analytics from database');

    const [
      totalLeads,
      leadsByStatusGroup,
      leadSourcesGroup,
      totalActivitiesLogged,
      agents,
    ] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.lead.groupBy({
        by: ['leadSource'],
        _count: { id: true },
        _sum: { estimatedValue: true },
      }),
      this.prisma.leadActivity.count(),
      this.prisma.user.findMany({
        where: { role: 'AGENT' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          assignedLeads: {
            select: { id: true, status: true },
          },
          leadActivities: {
            select: { id: true },
          },
        },
      }),
    ]);

    const leadsByStatus: Record<string, number> = {};
    for (const g of leadsByStatusGroup) {
      leadsByStatus[g.status] = g._count.id;
    }

    const leadSources = leadSourcesGroup.map((g) => ({
      source: g.leadSource,
      count: g._count.id,
      estimatedValue: Number(g._sum.estimatedValue || 0),
    }));

    const agentActivityBreakdown = agents.map((agent: any) => ({
      agentId: agent.id,
      agentName: `${agent.firstName} ${agent.lastName}`.trim() || agent.email,
      activitiesCount: agent.leadActivities?.length || 0,
    }));

    const agentConversions = agents.map((agent: any) => {
      const assignedCount = agent.assignedLeads?.length || 0;
      const convertedCount = (agent.assignedLeads || []).filter(
        (l: any) => l.status === LeadStatus.CONVERTED,
      ).length;
      const conversionRate =
        assignedCount > 0 ? Number(((convertedCount / assignedCount) * 100).toFixed(1)) : 0;

      return {
        agentId: agent.id,
        agentName: `${agent.firstName} ${agent.lastName}`.trim() || agent.email,
        assignedLeadsCount: assignedCount,
        convertedLeadsCount: convertedCount,
        conversionRate,
      };
    });

    return {
      totalLeads,
      leadsByStatus,
      leadSources,
      agentActivity: {
        totalActivitiesLogged,
        breakdown: agentActivityBreakdown,
      },
      agentConversions,
    };
  }

  /**
   * 5. Campaign Analytics (Actual DB Attribution vs External Ad Metrics Distinction)
   */
  async getCampaignAnalytics(): Promise<CampaignAnalyticsResult> {
    this.logger.log('Computing campaign attribution and revenue performance from database');

    const campaigns = await this.prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        campaignCode: true,
        platform: true,
        budget: true,
        status: true,
        leads: {
          select: { id: true },
        },
        orders: {
          where: {
            status: { in: this.paidStatuses },
          },
          select: {
            id: true,
            totalAmount: true,
          },
        },
      },
    });

    let totalAttributedRevenue = 0;
    let totalAttributedOrders = 0;
    let totalAttributedLeads = 0;

    const campaignResults = campaigns.map((c: any) => {
      const leadsCount = c.leads?.length || 0;
      const ordersCount = c.orders?.length || 0;
      const revenueGenerated = (c.orders || []).reduce(
        (sum: number, o: any) => sum + Number(o.totalAmount || 0),
        0,
      );
      const budget = Number(c.budget || 0);

      const realizedRoiPercentage =
        budget > 0
          ? Number((((revenueGenerated - budget) / budget) * 100).toFixed(1))
          : revenueGenerated > 0
          ? 100.0
          : 0.0;

      totalAttributedRevenue += revenueGenerated;
      totalAttributedOrders += ordersCount;
      totalAttributedLeads += leadsCount;

      return {
        id: c.id,
        name: c.name,
        campaignCode: c.campaignCode,
        platform: c.platform,
        budget,
        status: c.status,
        leadsCount,
        ordersCount,
        revenueGenerated,
        realizedRoiPercentage,
      };
    });

    return {
      metricsProvenance: 'ACTUAL_DATABASE_METRICS',
      externalAdMetricsDisclaimer:
        'All reporting reflects actual internal PostgreSQL transactional records. External advertising platform metrics (Ad Impressions, Reach, Click-Through Rates, Cost Per Click) are third-party advertising-network metrics that require active Meta/TikTok/Google Ads API tokens.',
      campaigns: campaignResults,
      totalAttributedRevenue,
      totalAttributedOrders,
      totalAttributedLeads,
    };
  }

  /**
   * 6. Production Analytics (Average Days, Pending, Completed, Delayed)
   */
  async getProductionAnalytics(): Promise<ProductionAnalyticsResult> {
    this.logger.log('Computing atelier workshop production metrics from database');

    const now = new Date();

    const [
      pendingJobsCount,
      completedJobsCount,
      delayedJobsCount,
      completedJobsWithDates,
      jobsByStageGroup,
    ] = await Promise.all([
      // Pending jobs: in any active production stage
      this.prisma.productionJob.count({
        where: {
          status: {
            in: [
              ProductionStatus.NEW,
              ProductionStatus.CUTTING,
              ProductionStatus.STITCHING,
              ProductionStatus.CRAFTING,
              ProductionStatus.FINISHING,
              ProductionStatus.QUALITY_CHECK,
              ProductionStatus.ON_HOLD,
            ],
          },
        },
      }),
      // Completed jobs
      this.prisma.productionJob.count({
        where: {
          status: {
            in: [ProductionStatus.READY, ProductionStatus.COMPLETED],
          },
        },
      }),
      // Delayed jobs: targetCompletionDate < NOW() and not completed
      this.prisma.productionJob.count({
        where: {
          targetCompletionDate: { lt: now },
          status: {
            notIn: [ProductionStatus.READY, ProductionStatus.COMPLETED],
          },
        },
      }),
      // Completed jobs to compute real duration
      this.prisma.productionJob.findMany({
        where: {
          status: { in: [ProductionStatus.READY, ProductionStatus.COMPLETED] },
          actualCompletionDate: { not: null },
        },
        select: {
          createdAt: true,
          actualCompletionDate: true,
        },
      }),
      // Group by stage
      this.prisma.productionJob.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    // Compute average days
    let totalDays = 0;
    for (const job of completedJobsWithDates) {
      if (job.actualCompletionDate) {
        const diffMs = job.actualCompletionDate.getTime() - job.createdAt.getTime();
        const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        totalDays += diffDays;
      }
    }

    const averageProductionDays =
      completedJobsWithDates.length > 0
        ? Number((totalDays / completedJobsWithDates.length).toFixed(1))
        : 0;

    const jobsByStage: Record<string, number> = {};
    for (const g of jobsByStageGroup) {
      jobsByStage[g.status] = g._count.id;
    }

    return {
      pendingJobs: pendingJobsCount,
      completedJobs: completedJobsCount,
      delayedJobs: delayedJobsCount,
      averageProductionDays,
      jobsByStage,
    };
  }

  /**
   * Unified Master Business Report
   */
  async getFullBusinessReport() {
    this.logger.log('Compiling comprehensive business analytics master report');

    const [customers, sales, customDesign, crm, campaign, production] = await Promise.all([
      this.getCustomerAnalytics(),
      this.getSalesAnalytics(),
      this.getCustomDesignAnalytics(),
      this.getCrmAnalytics(),
      this.getCampaignAnalytics(),
      this.getProductionAnalytics(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      provenance: 'ACTUAL_DATABASE_METRICS',
      customers,
      sales,
      customDesign,
      crm,
      campaign,
      production,
    };
  }

  // Helper for Year-Week string (e.g., 2026-W39)
  private getYearWeekString(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
}
