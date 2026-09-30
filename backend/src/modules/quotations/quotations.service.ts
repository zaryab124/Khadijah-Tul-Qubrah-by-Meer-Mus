import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  QuotationStatus,
  CustomRequestStatus,
  OrderStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { RequestChangesDto } from './dto/request-changes.dto';
import { RejectQuotationDto } from './dto/reject-quotation.dto';
import { RequestClarificationDto } from './dto/request-clarification.dto';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Designer creates a quotation (V1 or incremented version V2, V3...)
   * Server strictly calculates all item line totals, subtotal, and total amount.
   */
  async createQuotation(customRequestId: string, user: any, dto: CreateQuotationDto) {
    this.assertDesignerOrAdminRole(user);

    const request = await this.prisma.customDesignRequest.findUnique({
      where: { id: customRequestId },
      include: { customer: true },
    });

    if (!request) {
      throw new NotFoundException(`Custom design request "${customRequestId}" not found`);
    }

    this.assertDesignerAssignmentAccess(request, user);

    // SERVER-SIDE TOTALS CALCULATION - Never trust client totals!
    let calculatedSubtotal = new Prisma.Decimal(0.0);
    const itemRecords = dto.items.map((item) => {
      const qty = item.quantity || 1;
      const unit = new Prisma.Decimal(item.unitPrice || 0);
      const lineTotal = unit.mul(qty);
      calculatedSubtotal = calculatedSubtotal.add(lineTotal);

      return {
        itemTitle: item.itemTitle,
        itemType: item.itemType,
        description: item.description || null,
        quantity: qty,
        unitPrice: unit,
        lineTotal,
      };
    });

    const customizationFee = new Prisma.Decimal(dto.customizationFee || 0);
    const deliveryFee = new Prisma.Decimal(dto.deliveryFee || 0);
    const discountAmount = new Prisma.Decimal(dto.discountAmount || 0);
    const taxAmount = new Prisma.Decimal(dto.taxAmount || 0);

    // subtotal + customization_fee + delivery_fee + tax_amount - discount
    let totalAmount = calculatedSubtotal
      .add(customizationFee)
      .add(deliveryFee)
      .add(taxAmount)
      .sub(discountAmount);

    if (totalAmount.lessThan(0)) {
      totalAmount = new Prisma.Decimal(0.0);
    }

    // MANDATORY VERSIONING: Query existing quotes for this request to determine next version
    const existingQuotes = await this.prisma.quotation.findMany({
      where: { customRequestId },
      select: { versionNumber: true },
      orderBy: { versionNumber: 'desc' },
      take: 1,
    });

    const nextVersion = existingQuotes.length > 0 ? existingQuotes[0].versionNumber + 1 : 1;
    const cleanReqNum = request.requestNumber.replace('CDR-', '');
    const quoteNumber = `QT-${cleanReqNum}-V${nextVersion}`;

    const validDays = dto.validDays || 14;
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    const estimatedMinDays = dto.estimatedMinDays || 7;
    const estimatedMaxDays = dto.estimatedMaxDays || 21;

    // Create immutable quotation & items in transaction
    const quotation = await this.prisma.$transaction(async (tx) => {
      const createdQuote = await tx.quotation.create({
        data: {
          customRequestId,
          versionNumber: nextVersion,
          quoteNumber,
          createdBy: user.id,
          status: QuotationStatus.DRAFT,
          subtotalAmount: calculatedSubtotal,
          customizationFee,
          deliveryFee,
          shippingAmount: deliveryFee,
          discountAmount,
          taxAmount,
          totalAmount,
          currency: 'PKR',
          estimatedMinDays,
          estimatedMaxDays,
          estimatedProductionDays: estimatedMaxDays,
          designerNotes: dto.designerNotes || null,
          validUntil,
          items: {
            create: itemRecords,
          },
        },
        include: {
          items: true,
          designer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Update custom request: auto-assign designer if unassigned, transition status to QUOTE_PREPARATION
      await tx.customDesignRequest.update({
        where: { id: customRequestId },
        data: {
          ...(request.assignedDesignerId ? {} : { assignedDesignerId: user.id }),
          status: CustomRequestStatus.QUOTE_PREPARATION,
        },
      });

      return createdQuote;
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'QUOTATION_CREATED',
      entityTable: 'quotations',
      entityId: quotation.id,
      newState: {
        quoteNumber: quotation.quoteNumber,
        versionNumber: quotation.versionNumber,
        totalAmount: quotation.totalAmount.toString(),
        customRequestId,
      },
    });

    return quotation;
  }

  /**
   * Retrieve all quotation revisions for a custom request (V1, V2, V3...)
   */
  async getQuotationsForRequest(customRequestId: string, user: any) {
    const request = await this.prisma.customDesignRequest.findUnique({
      where: { id: customRequestId },
    });

    if (!request) {
      throw new NotFoundException(`Custom request "${customRequestId}" not found`);
    }

    this.assertRequestReadAccess(request, user);

    return this.prisma.quotation.findMany({
      where: { customRequestId },
      include: {
        items: true,
        designer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { versionNumber: 'desc' },
    });
  }

  /**
   * Get single quotation by ID with its itemized breakdown and permitted details
   */
  async getQuotationById(quotationId: string, user: any) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
        designer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        customRequest: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
            colour: true,
            fabric: true,
            standardSize: true,
            designFiles: true,
          },
        },
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation "${quotationId}" not found`);
    }

    this.assertRequestReadAccess(quotation.customRequest, user);

    return quotation;
  }

  /**
   * Designer or Admin sends the quotation to the customer
   */
  async sendQuotation(quotationId: string, user: any) {
    this.assertDesignerOrAdminRole(user);

    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customRequest: true },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation "${quotationId}" not found`);
    }

    this.assertDesignerAssignmentAccess(quotation.customRequest, user);

    if (
      quotation.status !== QuotationStatus.DRAFT &&
      quotation.status !== QuotationStatus.PENDING_APPROVAL
    ) {
      throw new BadRequestException(
        `Only quotations in DRAFT status can be sent (current status: ${quotation.status}).`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const quote = await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: QuotationStatus.SENT,
          sentAt: new Date(),
        },
        include: { items: true, designer: true },
      });

      await tx.customDesignRequest.update({
        where: { id: quotation.customRequestId },
        data: {
          status: CustomRequestStatus.QUOTE_SENT,
        },
      });

      return quote;
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'QUOTATION_SENT',
      entityTable: 'quotations',
      entityId: quotationId,
      previousState: { status: quotation.status },
      newState: { status: QuotationStatus.SENT },
    });

    return updated;
  }

  /**
   * Customer requests changes on a sent quotation.
   * Creates a revision workflow and updates statuses to REVISION_REQUESTED.
   */
  async requestChanges(quotationId: string, user: any, dto: RequestChangesDto) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customRequest: true },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation "${quotationId}" not found`);
    }

    // Only customer who owns the request (or admin) can request changes
    this.assertCustomerOwnershipOrAdmin(quotation.customRequest, user);

    if (quotation.status !== QuotationStatus.SENT) {
      throw new BadRequestException(
        `Revisions can only be requested on active SENT quotations (current status: ${quotation.status}).`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const quote = await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: QuotationStatus.REVISION_REQUESTED,
          customerChangeRequestNotes: dto.changeNotes,
        },
        include: { items: true },
      });

      await tx.customDesignRequest.update({
        where: { id: quotation.customRequestId },
        data: {
          status: CustomRequestStatus.REVISION_REQUESTED,
        },
      });

      return quote;
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'QUOTATION_REVISION_REQUESTED',
      entityTable: 'quotations',
      entityId: quotationId,
      previousState: { status: quotation.status },
      newState: {
        status: QuotationStatus.REVISION_REQUESTED,
        changeNotes: dto.changeNotes,
      },
    });

    return updated;
  }

  /**
   * Customer accepts a quotation (V1, V2, or V3).
   * - Marks this quotation as ACCEPTED.
   * - Sets all other previous quotations for this request to SUPERSEDED.
   * - Sets custom request to QUOTE_ACCEPTED and CONVERTED_TO_ORDER.
   * - Automatically triggers Order & OrderItems creation with status PENDING_PAYMENT.
   */
  async acceptQuotation(quotationId: string, user: any) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
        customRequest: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation "${quotationId}" not found`);
    }

    this.assertCustomerOwnershipOrAdmin(quotation.customRequest, user);

    if (quotation.status !== QuotationStatus.SENT) {
      throw new BadRequestException(
        `Only quotations with status "SENT" can be accepted (current status: ${quotation.status}).`,
      );
    }

    const orderNumber = await this.generateOrderNumber();

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Mark accepted quotation
      const acceptedQuote = await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: QuotationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
        include: { items: true },
      });

      // 2. Mark ALL other quotations for this request as SUPERSEDED so only accepted quote is active
      await tx.quotation.updateMany({
        where: {
          customRequestId: quotation.customRequestId,
          id: { not: quotationId },
          status: { not: QuotationStatus.REJECTED },
        },
        data: {
          status: QuotationStatus.SUPERSEDED,
        },
      });

      // 3. Advance custom design request status
      await tx.customDesignRequest.update({
        where: { id: quotation.customRequestId },
        data: {
          status: CustomRequestStatus.QUOTE_ACCEPTED,
        },
      });

      // 4. Trigger Order and OrderItems creation
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: quotation.customRequest.customerId,
          originCustomRequestId: quotation.customRequestId,
          acceptedQuotationId: quotation.id,
          originCampaignId: (quotation.customRequest as any).originCampaignId || null,
          originLeadId: (quotation.customRequest as any).originLeadId || null,
          status: OrderStatus.PENDING_PAYMENT,
          subtotalAmount: quotation.subtotalAmount,
          discountAmount: quotation.discountAmount,
          shippingAmount: quotation.deliveryFee,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          currency: quotation.currency,
          orderItems: {
            create: quotation.items.map((item) => ({
              customRequestId: quotation.customRequestId,
              itemTitle: item.itemTitle,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
              specifications: {
                itemType: item.itemType,
                description: item.description,
              },
            })),
          },
        },
        include: {
          orderItems: true,
        },
      });

      // Mark custom request converted to order
      await tx.customDesignRequest.update({
        where: { id: quotation.customRequestId },
        data: {
          status: CustomRequestStatus.CONVERTED_TO_ORDER,
        },
      });

      return { quotation: acceptedQuote, order };
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'QUOTATION_ACCEPTED',
      entityTable: 'quotations',
      entityId: quotation.id,
      newState: {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        status: QuotationStatus.ACCEPTED,
      },
    });

    return result;
  }

  /**
   * Customer or Admin rejects a quotation
   */
  async rejectQuotation(quotationId: string, user: any, dto: RejectQuotationDto) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customRequest: true },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation "${quotationId}" not found`);
    }

    this.assertCustomerOwnershipOrAdmin(quotation.customRequest, user);

    const updated = await this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: QuotationStatus.REJECTED,
        customerChangeRequestNotes: dto.rejectionReason || 'Customer rejected quotation',
      },
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'QUOTATION_REJECTED',
      entityTable: 'quotations',
      entityId: quotationId,
      newState: { status: QuotationStatus.REJECTED, reason: dto.rejectionReason },
    });

    return updated;
  }

  /**
   * Designer Dashboard queue aggregator
   */
  async getDesignerDashboard(user: any) {
    this.assertDesignerOrAdminRole(user);

    const isDesigner = user.role === UserRole.DESIGNER;
    const designerFilter = isDesigner ? { assignedDesignerId: user.id } : {};

    const [
      newRequests,
      assignedRequests,
      clarificationRequests,
      quotationPreparation,
      revisionRequests,
      completedQuotes,
    ] = await Promise.all([
      // 1. New custom requests: submitted and unassigned
      this.prisma.customDesignRequest.findMany({
        where: {
          status: CustomRequestStatus.SUBMITTED,
          assignedDesignerId: null,
        },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          referencedProduct: { select: { id: true, name: true } },
          colour: true,
          fabric: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // 2. Assigned requests: assigned to this designer in review/clarification
      this.prisma.customDesignRequest.findMany({
        where: {
          ...designerFilter,
          status: { in: [CustomRequestStatus.ASSIGNED, CustomRequestStatus.DESIGN_REVIEW] },
        },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          colour: true,
          fabric: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // 3. Requests requiring clarification
      this.prisma.customDesignRequest.findMany({
        where: {
          ...designerFilter,
          status: CustomRequestStatus.CLARIFICATION_REQUESTED,
        },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // 4. Quotation preparation
      this.prisma.customDesignRequest.findMany({
        where: {
          ...designerFilter,
          status: CustomRequestStatus.QUOTE_PREPARATION,
        },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          quotations: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // 5. Revision requests
      this.prisma.customDesignRequest.findMany({
        where: {
          ...designerFilter,
          status: CustomRequestStatus.REVISION_REQUESTED,
        },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          quotations: {
            where: { status: QuotationStatus.REVISION_REQUESTED },
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // 6. Completed quotes (Accepted / converted to orders)
      this.prisma.quotation.findMany({
        where: {
          ...(isDesigner ? { createdBy: user.id } : {}),
          status: QuotationStatus.ACCEPTED,
        },
        include: {
          customRequest: {
            include: {
              customer: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { acceptedAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      metrics: {
        newRequestsCount: newRequests.length,
        assignedRequestsCount: assignedRequests.length,
        clarificationRequestsCount: clarificationRequests.length,
        quotationPreparationCount: quotationPreparation.length,
        revisionRequestsCount: revisionRequests.length,
        completedQuotesCount: completedQuotes.length,
      },
      queues: {
        newRequests,
        assignedRequests,
        clarificationRequests,
        quotationPreparation,
        revisionRequests,
        completedQuotes,
      },
    };
  }

  /**
   * Designer accepts an unassigned request
   */
  async acceptJob(customRequestId: string, user: any) {
    this.assertDesignerOrAdminRole(user);

    const request = await this.prisma.customDesignRequest.findUnique({
      where: { id: customRequestId },
    });

    if (!request) {
      throw new NotFoundException(`Custom design request "${customRequestId}" not found`);
    }

    if (request.assignedDesignerId && request.assignedDesignerId !== user.id) {
      throw new BadRequestException('This custom request has already been assigned to another designer.');
    }

    const updated = await this.prisma.customDesignRequest.update({
      where: { id: customRequestId },
      data: {
        assignedDesignerId: user.id,
        status: CustomRequestStatus.DESIGN_REVIEW,
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        colour: true,
        fabric: true,
      },
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'CUSTOM_REQUEST_ACCEPTED_BY_DESIGNER',
      entityTable: 'custom_design_requests',
      entityId: customRequestId,
      newState: { assignedDesignerId: user.id, status: CustomRequestStatus.DESIGN_REVIEW },
    });

    return updated;
  }

  /**
   * Designer sends clarification inquiry to customer
   */
  async requestClarification(customRequestId: string, user: any, dto: RequestClarificationDto) {
    this.assertDesignerOrAdminRole(user);

    const request = await this.prisma.customDesignRequest.findUnique({
      where: { id: customRequestId },
    });

    if (!request) {
      throw new NotFoundException(`Custom design request "${customRequestId}" not found`);
    }

    this.assertDesignerAssignmentAccess(request, user);

    const updated = await this.prisma.customDesignRequest.update({
      where: { id: customRequestId },
      data: {
        clarificationNotes: dto.clarificationNotes,
        status: CustomRequestStatus.CLARIFICATION_REQUESTED,
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'CLARIFICATION_REQUESTED_BY_DESIGNER',
      entityTable: 'custom_design_requests',
      entityId: customRequestId,
      newState: {
        clarificationNotes: dto.clarificationNotes,
        status: CustomRequestStatus.CLARIFICATION_REQUESTED,
      },
    });

    return updated;
  }

  // --- ACCESS CONTROL GUARDS ---

  private assertDesignerOrAdminRole(user: any) {
    if (
      user.role !== UserRole.DESIGNER &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Access denied: Only designers and administrators can perform this quotation action.',
      );
    }
  }

  private assertDesignerAssignmentAccess(request: any, user: any) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return;
    }

    if (
      user.role === UserRole.DESIGNER &&
      request.assignedDesignerId &&
      request.assignedDesignerId !== user.id
    ) {
      throw new ForbiddenException(
        'Access denied: This custom request is assigned to a different designer.',
      );
    }
  }

  private assertRequestReadAccess(request: any, user: any) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.CUSTOMER) {
      if (request.customerId !== user.id) {
        throw new ForbiddenException('Access denied: You cannot view quotations for another customer.');
      }
      return;
    }

    if (user.role === UserRole.AGENT) {
      if (request.assignedAgentId && request.assignedAgentId !== user.id) {
        throw new ForbiddenException('Access denied: You are not the assigned sales agent.');
      }
      return;
    }

    if (user.role === UserRole.DESIGNER) {
      if (request.assignedDesignerId && request.assignedDesignerId !== user.id) {
        throw new ForbiddenException('Access denied: You are not the assigned designer.');
      }
      return;
    }
  }

  private assertCustomerOwnershipOrAdmin(request: any, user: any) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role !== UserRole.CUSTOMER || request.customerId !== user.id) {
      throw new ForbiddenException(
        'Access denied: Only the customer who submitted this custom request can perform this action.',
      );
    }
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
