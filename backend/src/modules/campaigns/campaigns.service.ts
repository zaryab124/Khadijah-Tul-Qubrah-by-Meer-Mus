import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, CampaignStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreatePlatformDto } from './dto/create-platform.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * 1. Create a new Marketing Campaign with platform, code, and allocated budget
   */
  async createCampaign(dto: CreateCampaignDto, user?: any) {
    const existingCode = await this.prisma.campaign.findUnique({
      where: { campaignCode: dto.campaignCode },
    });

    if (existingCode) {
      throw new ConflictException(
        `Campaign code "${dto.campaignCode}" is already in use. Please specify a unique code.`,
      );
    }

    const budgetDecimal = new Prisma.Decimal(dto.budget);

    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        title: dto.name, // Backward compatibility
        platform: dto.platform,
        campaignCode: dto.campaignCode.toUpperCase().trim(),
        utmCampaign: dto.campaignCode.toUpperCase().trim(),
        utmSource: dto.utmSource || null,
        utmMedium: dto.utmMedium || null,
        budget: budgetDecimal,
        allocatedBudget: budgetDecimal,
        status: dto.status || CampaignStatus.ACTIVE,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        description: dto.description || null,
        isActive: dto.status !== CampaignStatus.CANCELLED && dto.status !== CampaignStatus.COMPLETED,
      },
    });

    await this.auditService.logAction({
      actorId: user?.id || null,
      action: 'CAMPAIGN_CREATED',
      entityTable: 'campaigns',
      entityId: campaign.id,
      newState: {
        name: campaign.name,
        campaignCode: campaign.campaignCode,
        platform: campaign.platform,
        budget: campaign.budget,
        status: campaign.status,
      },
    });

    return campaign;
  }

  /**
   * 2. Update existing campaign properties, budget, dates or status
   */
  async updateCampaign(campaignId: string, dto: UpdateCampaignDto, user?: any) {
    const existing = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!existing) {
      throw new NotFoundException(`Campaign "${campaignId}" not found`);
    }

    if (dto.campaignCode && dto.campaignCode !== existing.campaignCode) {
      const codeTaken = await this.prisma.campaign.findUnique({
        where: { campaignCode: dto.campaignCode.toUpperCase().trim() },
      });
      if (codeTaken) {
        throw new ConflictException(`Campaign code "${dto.campaignCode}" is already taken.`);
      }
    }

    const data: Prisma.CampaignUpdateInput = {};

    if (dto.name) {
      data.name = dto.name;
      data.title = dto.name;
    }
    if (dto.platform) data.platform = dto.platform;
    if (dto.campaignCode) {
      data.campaignCode = dto.campaignCode.toUpperCase().trim();
      data.utmCampaign = dto.campaignCode.toUpperCase().trim();
    }
    if (dto.budget !== undefined) {
      data.budget = new Prisma.Decimal(dto.budget);
      data.allocatedBudget = new Prisma.Decimal(dto.budget);
    }
    if (dto.status) {
      data.status = dto.status;
      data.isActive = dto.status !== CampaignStatus.CANCELLED && dto.status !== CampaignStatus.COMPLETED;
    }
    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data,
    });

    await this.auditService.logAction({
      actorId: user?.id || null,
      action: 'CAMPAIGN_UPDATED',
      entityTable: 'campaigns',
      entityId: campaignId,
      previousState: { status: existing.status, budget: existing.budget },
      newState: { status: updated.status, budget: updated.budget },
    });

    return updated;
  }

  /**
   * 3. Get campaign details by ID with aggregated counts
   */
  async getCampaignById(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            leads: true,
            orders: true,
            customRequests: true,
            customers: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign "${campaignId}" not found`);
    }

    return campaign;
  }

  /**
   * 4. Resolve campaign attribution when customer lands via campaign link (?campaign_code=SUMMER26)
   */
  async getCampaignByCode(campaignCode: string) {
    const cleanCode = campaignCode.toUpperCase().trim();
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignCode: cleanCode },
    });

    if (!campaign) {
      throw new NotFoundException(
        `Campaign tracking code "${campaignCode}" was not found or is invalid.`,
      );
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException(
        `Campaign "${campaign.name}" (${cleanCode}) is currently ${campaign.status}. Attribution active only on ACTIVE campaigns.`,
      );
    }

    // Verify campaign validity dates if configured
    const now = new Date();
    if (campaign.startDate && campaign.startDate > now) {
      throw new BadRequestException(`Campaign has not started yet (Launches on ${campaign.startDate.toISOString()}).`);
    }
    if (campaign.endDate && campaign.endDate < now) {
      throw new BadRequestException(`Campaign expired on ${campaign.endDate.toISOString()}.`);
    }

    return {
      attribution: {
        campaignId: campaign.id,
        campaignCode: campaign.campaignCode,
        campaignName: campaign.name,
        platform: campaign.platform,
        isActive: campaign.isActive,
      },
      clientTrackingPayload: {
        cookieName: 'ktq_campaign_code',
        cookieValue: campaign.campaignCode,
        maxAgeSeconds: 2592000, // 30 days attribution window
      },
    };
  }

  /**
   * 5. List all campaigns with filters
   */
  async listCampaigns(status?: CampaignStatus, platform?: string) {
    const where: Prisma.CampaignWhereInput = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;

    return this.prisma.campaign.findMany({
      where,
      include: {
        _count: {
          select: {
            leads: true,
            orders: true,
            customRequests: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 6. Configurable Platforms Management (Facebook, Instagram, TikTok, WhatsApp, Website, Other)
   */
  async listPlatforms() {
    let platforms = await this.prisma.campaignPlatform.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Seed defaults if empty
    if (platforms.length === 0) {
      const defaults = [
        { code: 'FACEBOOK', name: 'Facebook', description: 'Meta Facebook feed, reels & carousel advertisements' },
        { code: 'INSTAGRAM', name: 'Instagram', description: 'Meta Instagram stories, posts, reels & influencer collaborations' },
        { code: 'TIKTOK', name: 'TikTok', description: 'TikTok viral video marketing & festive fashion previews' },
        { code: 'WHATSAPP', name: 'WhatsApp', description: 'VIP client concierge broadcast lists & direct catalog links' },
        { code: 'WEBSITE', name: 'Website', description: 'Official atelier digital storefront, banners & promotions' },
        { code: 'OTHER', name: 'Other', description: 'Print media, private trunk shows & bespoke referrals' },
      ];

      for (const def of defaults) {
        await this.prisma.campaignPlatform.upsert({
          where: { code: def.code },
          update: {},
          create: def,
        });
      }

      platforms = await this.prisma.campaignPlatform.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    }

    return platforms;
  }

  async createPlatform(dto: CreatePlatformDto, user?: any) {
    const existing = await this.prisma.campaignPlatform.findUnique({
      where: { code: dto.code.toUpperCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`Platform code "${dto.code}" already exists.`);
    }

    const platform = await this.prisma.campaignPlatform.create({
      data: {
        code: dto.code.toUpperCase().trim(),
        name: dto.name,
        description: dto.description || null,
        isActive: true,
      },
    });

    await this.auditService.logAction({
      actorId: user?.id || null,
      action: 'PLATFORM_CONFIGURED',
      entityTable: 'campaign_platforms',
      entityId: platform.id,
      newState: { code: platform.code, name: platform.name },
    });

    return platform;
  }

  /**
   * 7. End-to-End Campaign Attribution & Realized ROI Report
   * Answers:
   * - Which campaign generated this customer?
   * - Which campaign generated orders?
   * - Which campaign generated revenue?
   */
  async getCampaignAttributionAnalytics(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        leads: {
          select: {
            id: true,
            leadNumber: true,
            leadSource: true,
            status: true,
            firstName: true,
            lastName: true,
            contactPhone: true,
            contactEmail: true,
            estimatedValue: true,
            convertedAt: true,
            createdAt: true,
          },
        },
        customers: {
          select: {
            userId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        customRequests: {
          select: {
            id: true,
            requestNumber: true,
            status: true,
            customerBudget: true,
            createdAt: true,
            customer: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            currency: true,
            confirmedAt: true,
            createdAt: true,
            customer: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign "${campaignId}" not found`);
    }

    // 1. Calculate Realized Revenue from verified Paid / In-Progress Orders
    const paidOrders = campaign.orders.filter(
      (ord) =>
        ord.paymentStatus === PaymentStatus.CAPTURED ||
        (
          [
            OrderStatus.PAID,
            OrderStatus.CONFIRMED,
            OrderStatus.IN_PRODUCTION,
            OrderStatus.QUALITY_CHECK,
            OrderStatus.READY_TO_SHIP,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ] as OrderStatus[]
        ).includes(ord.status),
    );

    const totalRealizedRevenue = paidOrders.reduce(
      (sum, ord) => sum + Number(ord.totalAmount),
      0,
    );

    const budget = Number(campaign.budget);
    const netProfit = totalRealizedRevenue - budget;
    const roiPercentage = budget > 0 ? (netProfit / budget) * 100 : 0;
    const averageOrderValue = paidOrders.length > 0 ? totalRealizedRevenue / paidOrders.length : 0;
    const leadConversionRate =
      campaign.leads.length > 0
        ? (campaign.leads.filter((l) => l.status === 'CONVERTED').length / campaign.leads.length) * 100
        : 0;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        campaignCode: campaign.campaignCode,
        status: campaign.status,
        budget: campaign.budget,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      performance: {
        leadsGenerated: campaign.leads.length,
        customersAcquired: campaign.customers.length,
        customRequestsCreated: campaign.customRequests.length,
        totalOrdersPlaced: campaign.orders.length,
        paidOrdersCount: paidOrders.length,
        totalRealizedRevenue,
        currency: 'PKR',
        averageOrderValue: Math.round(averageOrderValue),
        netProfit,
        roiPercentage: Number(roiPercentage.toFixed(2)),
        leadConversionRate: Number(leadConversionRate.toFixed(2)),
      },
      // 1. Which campaign generated this customer?
      acquiredCustomers: campaign.customers.map((c) => ({
        customerId: c.userId,
        customerName: `${c.user.firstName} ${c.user.lastName}`,
        email: c.user.email,
        phone: c.user.phoneNumber,
        joinedAt: c.createdAt,
      })),
      // 2. Which campaign generated orders?
      ordersGenerated: campaign.orders.map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        customer: `${o.customer.firstName} ${o.customer.lastName}`,
        totalAmount: Number(o.totalAmount),
        currency: o.currency,
        status: o.status,
        paymentStatus: o.paymentStatus,
        date: o.createdAt,
      })),
      // 3. Realistic API integration disclaimer
      externalAdMetrics: {
        integrated: false,
        note:
          'Meta Marketing API / TikTok Ads API integration is not active. Ad spend, impressions, CTR and CPC are NOT claimed without live external API integration. Real metrics above are 100% computed from internal PostgreSQL orders, leads, and customer attribution records.',
      },
    };
  }

  /**
   * 8. Cross-Campaign Strategic Attribution Overview
   */
  async getOverviewAnalytics() {
    const campaigns = await this.prisma.campaign.findMany({
      include: {
        leads: { select: { id: true, status: true } },
        customers: { select: { userId: true } },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalAllocatedBudget = 0;
    let totalRealizedRevenue = 0;
    let totalLeadsAcquired = 0;
    let totalOrdersGenerated = 0;

    const campaignBreakdown = campaigns.map((camp) => {
      const budget = Number(camp.budget);
      totalAllocatedBudget += budget;
      totalLeadsAcquired += camp.leads.length;
      totalOrdersGenerated += camp.orders.length;

      const paidOrders = camp.orders.filter(
        (o) =>
          o.paymentStatus === PaymentStatus.CAPTURED ||
          (
            [
              OrderStatus.PAID,
              OrderStatus.CONFIRMED,
              OrderStatus.IN_PRODUCTION,
              OrderStatus.QUALITY_CHECK,
              OrderStatus.READY_TO_SHIP,
              OrderStatus.SHIPPED,
              OrderStatus.DELIVERED,
            ] as OrderStatus[]
          ).includes(o.status),
      );

      const realizedRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      totalRealizedRevenue += realizedRevenue;

      const roi = budget > 0 ? ((realizedRevenue - budget) / budget) * 100 : 0;

      return {
        campaignId: camp.id,
        name: camp.name,
        platform: camp.platform,
        campaignCode: camp.campaignCode,
        status: camp.status,
        budget,
        leadsCount: camp.leads.length,
        customersCount: camp.customers.length,
        ordersCount: camp.orders.length,
        paidOrdersCount: paidOrders.length,
        realizedRevenue,
        roiPercentage: Number(roi.toFixed(2)),
      };
    });

    const netProfit = totalRealizedRevenue - totalAllocatedBudget;
    const overallRoi = totalAllocatedBudget > 0 ? (netProfit / totalAllocatedBudget) * 100 : 0;

    return {
      totals: {
        totalCampaigns: campaigns.length,
        totalAllocatedBudget,
        totalRealizedRevenue,
        netProfit,
        overallRoiPercentage: Number(overallRoi.toFixed(2)),
        totalLeadsAcquired,
        totalOrdersGenerated,
        currency: 'PKR',
      },
      campaigns: campaignBreakdown,
      disclaimer:
        'All revenues and conversions reflect internal PostgreSQL transactions. No external platform metrics (e.g. Meta ROAS) are assumed without live API integrations.',
    };
  }
}
