import { Injectable } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentIntentResult,
  PaymentVerificationResult,
  PaymentRefundResult,
} from './payment-provider.interface';

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  readonly providerName = 'STRIPE';

  async createPaymentIntent(
    order: {
      id: string;
      orderNumber: string;
      totalAmount: number | string;
      currency: string;
      customer: { id: string; email: string; firstName: string; lastName: string };
    },
    options?: Record<string, any>,
  ): Promise<PaymentIntentResult> {
    const txnRef = `pi_stripe_${order.orderNumber}_${Date.now()}`;
    return {
      transactionReference: txnRef,
      amount: Number(order.totalAmount),
      currency: order.currency || 'USD',
      clientSecret: `${txnRef}_secret_${Date.now()}`,
      checkoutUrl: `https://checkout.stripe.com/pay/${txnRef}`,
      metadata: { orderId: order.id, customerEmail: order.customer.email, ...options },
    };
  }

  async verifyPayment(
    transactionReference: string,
    verificationPayload: any,
  ): Promise<PaymentVerificationResult> {
    // In production, verifies Stripe webhook signature or calls stripe.paymentIntents.retrieve()
    if (verificationPayload?.paymentIntentStatus === 'succeeded' || verificationPayload?.status === 'succeeded') {
      return {
        success: true,
        transactionReference,
        amountVerified: Number(verificationPayload.amount || 0),
        currency: verificationPayload.currency || 'USD',
        gatewayTransactionId: verificationPayload.id || `ch_${Date.now()}`,
        rawResponse: verificationPayload,
      };
    }

    return {
      success: false,
      transactionReference,
      amountVerified: 0,
      currency: 'USD',
      failureReason: verificationPayload?.last_payment_error?.message || 'Stripe payment was not successful',
      rawResponse: verificationPayload,
    };
  }

  async refundPayment(
    transactionReference: string,
    amount?: number,
  ): Promise<PaymentRefundResult> {
    return {
      success: true,
      refundReference: `re_${transactionReference.slice(3)}`,
      amountRefunded: amount || 0,
    };
  }
}
