import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import {
  UserRole,
  OrderStatus,
  CustomRequestStatus,
  QuotationStatus,
  LeadStatus,
  ProductionStatus,
} from '@prisma/client';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminUserQueryDto, AuditLogQueryDto } from './dto/admin-query.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Executive Dashboard Aggregator.
   * Computes live KPIs directly from PostgreSQL.
   */
  async getDashboardSummary() {
    this.logger.log('Computing executive dashboard metrics');

    // 1. Total Sales & Revenue Aggregation
    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.CONFIRMED,
      OrderStatus.IN_PRODUCTION,
      OrderStatus.QUALITY_CHECK,
      OrderStatus.READY_TO_SHIP,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    const salesAggregate = await this.prisma.order.aggregate({
      where: {
        status: { in: paidStatuses },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const totalSales = Number(salesAggregate._sum.totalAmount || 0);

    // 2. Orders by Status
    const [
      totalOrders,
      pendingPaymentOrders,
      paidOrders,
      inProductionOrders,
      qcOrders,
      readyToShipOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { status: OrderStatus.IN_PRODUCTION } }),
      this.prisma.order.count({ where: { status: OrderStatus.QUALITY_CHECK } }),
      this.prisma.order.count({ where: { status: OrderStatus.READY_TO_SHIP } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    ]);

    // 3. Custom Requests & Pending Quotes
    const [
      totalCustomRequests,
      activeCustomRequests,
      pendingQuotesCount,
    ] = await Promise.all([
      this.prisma.customDesignRequest.count(),
      this.prisma.customDesignRequest.count({
        where: {
          status: {
            notIn: [
              CustomRequestStatus.CONVERTED_TO_ORDER,
              CustomRequestStatus.CANCELLED,
              CustomRequestStatus.REJECTED,
            ],
          },
        },
      }),
      this.prisma.quotation.count({
        where: {
          status: {
            in: [
              QuotationStatus.DRAFT,
              QuotationStatus.PENDING_APPROVAL,
              QuotationStatus.SENT,
              QuotationStatus.REVISION_REQUESTED,
            ],
          },
        },
      }),
    ]);

    // 4. CRM & Leads
    const [totalLeads, activeLeads] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({
        where: {
          status: {
            notIn: [LeadStatus.CONVERTED, LeadStatus.LOST, LeadStatus.CLOSED],
          },
        },
      }),
    ]);

    // 5. Atelier Production Jobs
    const [totalJobs, activeJobs, qcJobs] = await Promise.all([
      this.prisma.productionJob.count(),
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
            ],
          },
        },
      }),
      this.prisma.productionJob.count({
        where: { status: ProductionStatus.QUALITY_CHECK },
      }),
    ]);

    // 6. Users by Role
    const [
      customersCount,
      agentsCount,
      designersCount,
      productionStaffCount,
      adminsCount,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      this.prisma.user.count({ where: { role: UserRole.AGENT } }),
      this.prisma.user.count({ where: { role: UserRole.DESIGNER } }),
      this.prisma.user.count({ where: { role: UserRole.PRODUCTION } }),
      this.prisma.user.count({
        where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } },
      }),
    ]);

    // 7. Recent Items for Feed
    const [recentOrders, recentCustomRequests, recentLeads, recentAuditLogs] =
      await Promise.all([
        this.prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            customer: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        }),
        this.prisma.customDesignRequest.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            requestNumber: true,
            status: true,
            designNotes: true,
            createdAt: true,
            customer: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        }),
        this.prisma.lead.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            leadNumber: true,
            firstName: true,
            lastName: true,
            leadSource: true,
            status: true,
            estimatedValue: true,
            createdAt: true,
          },
        }),
        this.prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
          },
        }),
      ]);

    return {
      kpi: {
        totalSales,
        totalSalesFormatted: `PKR ${totalSales.toLocaleString('en-PK')}`,
        orders: {
          total: totalOrders,
          pendingPayment: pendingPaymentOrders,
          paid: paidOrders,
          inProduction: inProductionOrders,
          qualityCheck: qcOrders,
          readyToShip: readyToShipOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        customRequests: {
          total: totalCustomRequests,
          active: activeCustomRequests,
        },
        pendingQuotes: pendingQuotesCount,
        leads: {
          total: totalLeads,
          active: activeLeads,
        },
        productionJobs: {
          total: totalJobs,
          active: activeJobs,
          qualityCheck: qcJobs,
        },
        users: {
          customers: customersCount,
          agents: agentsCount,
          designers: designersCount,
          production: productionStaffCount,
          admins: adminsCount,
        },
      },
      recentOrders,
      recentCustomRequests,
      recentLeads,
      recentAuditLogs,
    };
  }

  /**
   * User Management: List users with search and role filters.
   */
  async getUsers(query: AdminUserQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          isVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * User Management: Update role with RBAC enforcement and audit trail.
   */
  async updateUserRole(targetUserId: string, dto: UpdateUserRoleDto, actor: any) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // RBAC Rule 1: Only SUPER_ADMIN can promote to ADMIN or SUPER_ADMIN
    const adminRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    if (adminRoles.includes(dto.role) && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Privilege escalation rejected: Only a SUPER_ADMIN can grant administrative roles.',
      );
    }

    // RBAC Rule 2: Cannot demote a SUPER_ADMIN unless you are a SUPER_ADMIN
    if (
      targetUser.role === UserRole.SUPER_ADMIN &&
      actor.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Permission denied: Non-super administrators cannot alter a SUPER_ADMIN account.',
      );
    }

    const previousState = { role: targetUser.role };
    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });

    // Record audit log
    await this.auditService.logAction({
      actorId: actor.id,
      action: 'USER_ROLE_UPDATED',
      entityTable: 'users',
      entityId: targetUserId,
      previousState,
      newState: { role: dto.role, reason: dto.reason || 'Admin role assignment' },
    });

    return updatedUser;
  }

  /**
   * User Management: Toggle user account active status.
   */
  async updateUserStatus(targetUserId: string, dto: UpdateUserStatusDto, actor: any) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Safety: Cannot deactivate own account
    if (targetUser.id === actor.id) {
      throw new BadRequestException('Security protection: You cannot deactivate your own account.');
    }

    // Safety: Only SUPER_ADMIN can deactivate a SUPER_ADMIN
    if (targetUser.role === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot modify status of a SUPER_ADMIN account.');
    }

    const previousState = { isActive: targetUser.isActive };
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: dto.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Record audit log
    await this.auditService.logAction({
      actorId: actor.id,
      action: 'USER_STATUS_UPDATED',
      entityTable: 'users',
      entityId: targetUserId,
      previousState,
      newState: { isActive: dto.isActive, reason: dto.reason || 'Admin status change' },
    });

    return updated;
  }

  /**
   * Audit Trail: Query system audit logs with pagination and filters.
   */
  async getAuditLogs(query: AuditLogQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.entityTable) {
      where.entityTable = query.entityTable;
    }
    if (query.action) {
      where.action = query.action;
    }
    if (query.actorId) {
      where.actorId = query.actorId;
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Configurable Master Data Summary:
   * Returns current counts and configuration status across all business modules.
   */
  async getConfigSummary() {
    const [
      categoriesCount,
      coloursCount,
      sizesCount,
      sizeChartsCount,
      fabricsCount,
      craftOptionsCount,
      productsCount,
      campaignPlatformsCount,
      brandInfo,
    ] = await Promise.all([
      this.prisma.category.count(),
      this.prisma.colour.count(),
      this.prisma.size.count(),
      this.prisma.sizeChart.count(),
      this.prisma.fabric.count(),
      this.prisma.craftOption.count(),
      this.prisma.product.count(),
      this.prisma.campaignPlatform.count(),
      this.prisma.brand.findFirst(),
    ]);

    return {
      catalogue: {
        products: productsCount,
        categories: categoriesCount,
        colours: coloursCount,
        sizes: sizesCount,
        sizeCharts: sizeChartsCount,
        fabrics: fabricsCount,
        craftOptions: craftOptionsCount,
      },
      marketing: {
        campaignPlatforms: campaignPlatformsCount,
      },
      brand: {
        brandName: brandInfo?.officialName || 'KHADIJA-TUL-QUBRAH BY Meer&Mus',
        primaryDisplay: brandInfo?.primaryDisplay || 'KHADIJA-TUL-QUBRAH',
        secondarySignature: brandInfo?.secondarySignature || 'BY Meer&Mus',
        primaryColor: brandInfo?.primaryColor || '#072A20',
        secondaryColor: brandInfo?.secondaryColor || '#C5A059',
        isConfigured: !!brandInfo,
      },
    };
  }

  /**
   * Controlled Destructive Action Executor with mandatory audit logging.
   * Prevents raw unmanaged database operations.
   */
  async deleteEntitySafely(
    entityTable: 'products' | 'categories' | 'fabrics' | 'craft_options' | 'campaigns',
    entityId: string,
    actor: any,
    reason?: string,
  ) {
    this.logger.warn(
      `Controlled deletion initiated on table [${entityTable}] ID [${entityId}] by actor [${actor.id}]`,
    );

    let previousState: any = null;

    switch (entityTable) {
      case 'products':
        previousState = await this.prisma.product.findUnique({ where: { id: entityId } });
        if (!previousState) throw new NotFoundException('Product not found');
        // Soft delete / disable product
        await this.prisma.product.update({
          where: { id: entityId },
          data: { isActive: false },
        });
        break;

      case 'categories':
        previousState = await this.prisma.category.findUnique({ where: { id: entityId } });
        if (!previousState) throw new NotFoundException('Category not found');
        await this.prisma.category.delete({ where: { id: entityId } });
        break;

      case 'fabrics':
        previousState = await this.prisma.fabric.findUnique({ where: { id: entityId } });
        if (!previousState) throw new NotFoundException('Fabric not found');
        await this.prisma.fabric.update({
          where: { id: entityId },
          data: { isAvailable: false },
        });
        break;

      case 'craft_options':
        previousState = await this.prisma.craftOption.findUnique({ where: { id: entityId } });
        if (!previousState) throw new NotFoundException('Craft option not found');
        await this.prisma.craftOption.update({
          where: { id: entityId },
          data: { isActive: false },
        });
        break;

      case 'campaigns':
        previousState = await this.prisma.campaign.findUnique({ where: { id: entityId } });
        if (!previousState) throw new NotFoundException('Campaign not found');
        await this.prisma.campaign.update({
          where: { id: entityId },
          data: { status: 'CANCELLED' },
        });
        break;

      default:
        throw new BadRequestException(`Unsupported entity table for deletion: ${entityTable}`);
    }

    // Log destructive action to Audit Trail
    await this.auditService.logAction({
      actorId: actor.id,
      action: `CONTROLLED_DESTRUCTION_${entityTable.toUpperCase()}`,
      entityTable,
      entityId,
      previousState,
      newState: { status: 'DEACTIVATED_OR_REMOVED', reason: reason || 'Admin deliberate action' },
    });

    return {
      success: true,
      message: `Entity in ${entityTable} successfully managed and audit logged.`,
      entityId,
    };
  }
}
