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
import { PaymentProvider } from './providers/payment-provider.interface';
import { MockGatewayProvider } from './providers/mock-gateway.provider';
import { StripePaymentProvider } from './providers/stripe.provider';
import { BankWirePaymentProvider } from './providers/bank-wire.provider';
import { PayOrderDto } from '../orders/dto/pay-order.dto';
import { ConfirmPaymentDto } from '../orders/dto/confirm-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly providers: Map<string, PaymentProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mockGateway: MockGatewayProvider,
    private readonly stripeGateway: StripePaymentProvider,
    private readonly bankWireGateway: BankWirePaymentProvider,
  ) {
    this.registerProvider(this.mockGateway);
    this.registerProvider(this.stripeGateway);
    this.registerProvider(this.bankWireGateway);
  }

  registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.providerName.toUpperCase(), provider);
  }

  getProvider(gatewayName: string): PaymentProvider {
    const provider = this.providers.get((gatewayName || 'MOCK_GATEWAY').toUpperCase());
    if (!provider) {
      throw new BadRequestException(
        `Payment provider "${gatewayName}" is not supported. Available: ${Array.from(
          this.providers.keys(),
        ).join(', ')}`,
      );
    }
    return provider;
  }

  /**
   * Initiates payment for an order and returns provider checkout session/instructions
   */
  async initiatePayment(orderId: string, user: any, dto: PayOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" not found`);
    }

    this.assertOrderCustomerOrAdmin(order, user);

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Payment cannot be initiated for order in status "${order.status}". Only PENDING_PAYMENT orders are payable.`,
      );
    }

    const provider = this.getProvider(dto.paymentGateway || 'MOCK_GATEWAY');

    const intent = await provider.createPaymentIntent(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount.toNumber(),
        currency: order.currency,
        customer: order.customer,
      },
      dto.providerOptions,
    );

    // Save pending payment record in database
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        transactionReference: intent.transactionReference,
        paymentGateway: provider.providerName,
        amount: order.totalAmount,
        currency: order.currency,
        status: PaymentStatus.PENDING,
        gatewayResponse: intent.metadata || Prisma.JsonNull,
      },
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'PAYMENT_INITIATED',
      entityTable: 'payments',
      entityId: payment.id,
      newState: {
        orderId: order.id,
        transactionReference: intent.transactionReference,
        gateway: provider.providerName,
        amount: order.totalAmount.toString(),
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      ...intent,
    };
  }

  /**
   * Server-Side Payment Verification (NEVER trust frontend response alone!)
   * Validates with provider abstraction, handles idempotency, updates Order to PAID.
   */
  async verifyPayment(orderId: string, user: any, dto: ConfirmPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" not found`);
    }

    this.assertOrderCustomerOrAdmin(order, user);

    const payment = await this.prisma.payment.findUnique({
      where: { transactionReference: dto.transactionReference },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment record with reference "${dto.transactionReference}" not found.`,
      );
    }

    if (payment.orderId !== order.id) {
      throw new BadRequestException('Transaction reference does not match the specified order.');
    }

    // IDEMPOTENCY GUARD: If already captured and order is PAID, gracefully return without double processing
    if (payment.status === PaymentStatus.CAPTURED && order.status === OrderStatus.PAID) {
      return {
        idempotent: true,
        success: true,
        message: 'Payment has already been verified and processed.',
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: payment.status,
      };
    }

    const provider = this.getProvider(payment.paymentGateway);

    // Cryptographic / server-to-server confirmation with payment provider
    const verification = await provider.verifyPayment(
      dto.transactionReference,
      {
        ...dto.verificationPayload,
        expectedAmount: order.totalAmount.toNumber(),
        orderId: order.id,
      },
    );

    if (!verification.success) {
      // Payment failure handled server-side
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: {
            failureReason: verification.failureReason,
            raw: verification.rawResponse,
          },
        },
      });

      await this.auditService.logAction({
        actorId: user.id,
        action: 'PAYMENT_FAILED',
        entityTable: 'payments',
        entityId: payment.id,
        newState: {
          reason: verification.failureReason,
          status: PaymentStatus.FAILED,
        },
      });

      return {
        success: false,
        status: PaymentStatus.FAILED,
        failureReason: verification.failureReason || 'Payment verification failed at gateway.',
        orderId: order.id,
      };
    }

    // Payment Successful -> Execute atomic order state advancement & inventory updates
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Mark payment CAPTURED
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CAPTURED,
          paidAt: new Date(),
          gatewayResponse: verification.rawResponse || Prisma.JsonNull,
        },
      });

      // 2. Mark order PAID and CONFIRMED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.CAPTURED,
          confirmedAt: new Date(),
        },
        include: {
          orderItems: true,
        },
      });

      // 3. If standard product order, safely deduct inventory stock
      for (const item of order.orderItems) {
        if (item.productVariantId) {
          await tx.productVariant.updateMany({
            where: { id: item.productVariantId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return { order: updatedOrder, payment: updatedPayment };
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'PAYMENT_VERIFIED_SUCCESSFUL',
      entityTable: 'orders',
      entityId: order.id,
      newState: {
        orderNumber: order.orderNumber,
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.CAPTURED,
        amount: order.totalAmount.toString(),
      },
    });

    return {
      success: true,
      status: OrderStatus.PAID,
      message: 'Payment successfully confirmed and verified server-side. Production can begin.',
      order: result.order,
      payment: result.payment,
    };
  }

  private assertOrderCustomerOrAdmin(order: any, user: any) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role !== UserRole.CUSTOMER || order.customerId !== user.id) {
      throw new ForbiddenException(
        'Access denied: You are not authorized to view or pay for another customer order.',
      );
    }
  }
}
