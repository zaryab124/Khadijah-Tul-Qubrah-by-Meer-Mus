import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PayOrderDto } from './dto/pay-order.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * 1. Create Order from normal product catalog purchase
   */
  async createProductOrder(customerId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one product item.');
    }

    // 1. Resolve Shipping Address
    let shippingAddressId = dto.shippingAddressId;
    if (!shippingAddressId && dto.shippingAddress) {
      const createdAddr = await this.prisma.address.create({
        data: {
          userId: customerId,
          recipientName: dto.shippingAddress.recipientName,
          phoneNumber: dto.shippingAddress.phoneNumber,
          addressLine1: dto.shippingAddress.addressLine1,
          addressLine2: dto.shippingAddress.addressLine2 || null,
          city: dto.shippingAddress.city,
          stateProvince: dto.shippingAddress.stateProvince || null,
          postalCode: dto.shippingAddress.postalCode || null,
          country: dto.shippingAddress.country || 'Pakistan',
          isDefaultShipping: dto.shippingAddress.isDefaultShipping ?? true,
        },
      });
      shippingAddressId = createdAddr.id;
    }

    if (!shippingAddressId) {
      throw new BadRequestException('A valid shipping address is required to place an order.');
    }

    // 2. Fetch and validate each Product Variant & calculate totals on server
    let subtotalAmount = new Prisma.Decimal(0.0);
    const orderItemData: Array<{
      productVariantId: string;
      itemTitle: string;
      sku: string;
      unitPrice: Prisma.Decimal;
      quantity: number;
      lineTotal: Prisma.Decimal;
      specifications: any;
    }> = [];

    for (const itemInput of dto.items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: itemInput.productVariantId },
        include: {
          product: true,
          colour: true,
          size: true,
        },
      });

      if (!variant) {
        throw new NotFoundException(`Product variant "${itemInput.productVariantId}" not found`);
      }

      if (!variant.isActive || !variant.product.isActive) {
        throw new BadRequestException(
          `Product "${variant.product.name}" (${variant.sku}) is currently unavailable for purchase.`,
        );
      }

      if (variant.stockQuantity < itemInput.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${variant.product.name}" (${variant.sku}). Available: ${variant.stockQuantity}, Requested: ${itemInput.quantity}.`,
        );
      }

      const unitPrice = variant.product.basePrice.add(variant.priceAdjustment);
      const lineTotal = unitPrice.mul(itemInput.quantity);
      subtotalAmount = subtotalAmount.add(lineTotal);

      orderItemData.push({
        productVariantId: variant.id,
        itemTitle: `${variant.product.name} - ${variant.colour?.name || 'Default'} / ${
          variant.size?.name || 'Standard'
        }`,
        sku: variant.sku,
        unitPrice,
        quantity: itemInput.quantity,
        lineTotal,
        specifications: {
          colour: variant.colour?.name,
          size: variant.size?.name,
          productSlug: variant.product.slug,
        },
      });
    }

    const shippingAmount = new Prisma.Decimal(2500); // Standard insured courier transit
    const discountAmount = new Prisma.Decimal(0);
    const taxAmount = new Prisma.Decimal(0);
    const totalAmount = subtotalAmount.add(shippingAmount).sub(discountAmount).add(taxAmount);

    let originCampaignId: string | null = null;
    let originLeadId: string | null = null;

    if (dto.campaignCode) {
      const campaign = await this.prisma.campaign.findFirst({
        where: {
          OR: [
            { campaignCode: dto.campaignCode.toUpperCase().trim() },
            { utmCampaign: dto.campaignCode },
          ],
        },
      });
      if (campaign) {
        originCampaignId = campaign.id;
      }
    }

    if (!originCampaignId) {
      const profile = await this.prisma.customerProfile.findUnique({
        where: { userId: customerId },
      });
      if (profile?.originCampaignId) {
        originCampaignId = profile.originCampaignId;
        originLeadId = profile.originLeadId || null;
      }
    }

    const orderNumber = await this.generateOrderNumber();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        shippingAddressId,
        billingAddressId: shippingAddressId,
        originCampaignId,
        originLeadId,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotalAmount,
        shippingAmount,
        discountAmount,
        taxAmount,
        totalAmount,
        currency: 'PKR',
        orderNotes: dto.orderNotes || null,
        orderItems: {
          create: orderItemData.map((item) => ({
            productVariantId: item.productVariantId,
            itemTitle: item.itemTitle,
            sku: item.sku,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            specifications: item.specifications,
          })),
        },
      },
      include: {
        orderItems: true,
        shippingAddress: true,
      },
    });

    await this.auditService.logAction({
      actorId: customerId,
      action: 'ORDER_CREATED_CATALOG',
      entityTable: 'orders',
      entityId: order.id,
      newState: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount.toString(),
        itemsCount: order.orderItems.length,
      },
    });

    return order;
  }

  /**
   * 2. Get Order Details by ID with strict Customer Isolation Guard
   */
  async getOrderById(orderId: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        shippingAddress: true,
        billingAddress: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        originCustomRequest: {
          select: {
            id: true,
            requestNumber: true,
            sizingMode: true,
            status: true,
            colourPreference: true,
          },
        },
        acceptedQuotation: {
          select: {
            id: true,
            quoteNumber: true,
            versionNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" not found`);
    }

    this.assertOrderAccess(order, user);

    return order;
  }

  /**
   * 3. List Orders (Customer sees only own orders; Admin sees all)
   */
  async listOrders(user: any, status?: OrderStatus) {
    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (user.role === UserRole.CUSTOMER) {
      where.customerId = user.id;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        orderItems: true,
        shippingAddress: {
          select: { city: true, country: true, recipientName: true },
        },
        payments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 4. Initiate payment on order
   */
  async payOrder(orderId: string, user: any, dto: PayOrderDto) {
    return this.paymentsService.initiatePayment(orderId, user, dto);
  }

  /**
   * 5. Server-side payment confirmation & order state advancement
   */
  async verifyOrderPayment(orderId: string, user: any, dto: ConfirmPaymentDto) {
    return this.paymentsService.verifyPayment(orderId, user, dto);
  }

  /**
   * 6. Order Tracking Timeline
   */
  async getOrderTracking(orderId: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        shipments: {
          orderBy: { createdAt: 'desc' },
        },
        productionJobs: {
          include: {
            updates: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" not found`);
    }

    this.assertOrderAccess(order, user);

    const isPaid = order.paymentStatus === PaymentStatus.CAPTURED;
    const inProduction = (
      [
        OrderStatus.IN_PRODUCTION,
        OrderStatus.QUALITY_CHECK,
        OrderStatus.READY_TO_SHIP,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
      ] as OrderStatus[]
    ).includes(order.status);
    const inQC = (
      [
        OrderStatus.QUALITY_CHECK,
        OrderStatus.READY_TO_SHIP,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
      ] as OrderStatus[]
    ).includes(order.status);
    const isShipped = ([OrderStatus.SHIPPED, OrderStatus.DELIVERED] as OrderStatus[]).includes(order.status);
    const isDelivered = order.status === OrderStatus.DELIVERED;

    return {
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      currency: order.currency,
      shippingDestination: order.shippingAddress
        ? `${order.shippingAddress.city}, ${order.shippingAddress.country}`
        : 'To be specified',
      timeline: [
        {
          stage: 'ORDER_PLACED',
          title: 'Order Received & Drafted',
          timestamp: order.createdAt,
          isCompleted: true,
        },
        {
          stage: 'PAYMENT_VERIFIED',
          title: 'Payment Verified & Confirmed Server-Side',
          timestamp: order.confirmedAt,
          isCompleted: isPaid,
        },
        {
          stage: 'IN_PRODUCTION',
          title: 'Haute Couture Atelier Crafting',
          timestamp: inProduction ? order.updatedAt : null,
          isCompleted: inProduction,
        },
        {
          stage: 'QUALITY_CHECK',
          title: 'Master Artisan Quality Inspection',
          timestamp: inQC ? order.updatedAt : null,
          isCompleted: inQC,
        },
        {
          stage: 'SHIPPED',
          title: 'Dispatched via Insured Courier',
          timestamp: isShipped ? order.updatedAt : null,
          isCompleted: isShipped,
          trackingNumber: order.shipments?.[0]?.trackingNumber || null,
          carrier: order.shipments?.[0]?.courierName || null,
        },
        {
          stage: 'DELIVERED',
          title: 'Safely Delivered to Customer',
          timestamp: isDelivered ? order.updatedAt : null,
          isCompleted: isDelivered,
        },
      ],
      productionJobs: order.productionJobs || [],
      shipments: order.shipments || [],
    };
  }

  // Address operations
  async createAddress(userId: string, dto: CreateAddressDto) {
    return this.prisma.address.create({
      data: {
        userId,
        recipientName: dto.recipientName,
        phoneNumber: dto.phoneNumber,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2 || null,
        city: dto.city,
        stateProvince: dto.stateProvince || null,
        postalCode: dto.postalCode || null,
        country: dto.country || 'Pakistan',
        isDefaultShipping: dto.isDefaultShipping ?? true,
      },
    });
  }

  async listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefaultShipping: 'desc' },
    });
  }

  // --- ACCESS CONTROL GUARDS ---

  private assertOrderAccess(order: any, user: any) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.CUSTOMER) {
      if (order.customerId !== user.id) {
        throw new ForbiddenException(
          'Access denied: You do not have permission to access another customer order.',
        );
      }
      return;
    }

    if (user.role === UserRole.PRODUCTION) {
      return; // Production staff can view order details to fulfill garment
    }

    if (user.role === UserRole.AGENT) {
      return; // Permitted customer service agents
    }

    throw new ForbiddenException('Access denied for current user role.');
  }

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
    const count = await this.prisma.order.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `ORD-${yearMonth}-${seq}`;
  }
}
