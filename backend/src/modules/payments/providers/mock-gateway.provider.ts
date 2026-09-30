import { Injectable } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentIntentResult,
  PaymentVerificationResult,
  PaymentRefundResult,
} from './payment-provider.interface';

@Injectable()
export class MockGatewayProvider implements PaymentProvider {
  readonly providerName = 'MOCK_GATEWAY';

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
    const txnRef = `TXN-MOCK-${order.orderNumber}-${Date.now()}`;
    return {
      transactionReference: txnRef,
      amount: Number(order.totalAmount),
      currency: order.currency || 'PKR',
      clientSecret: `mock_secret_${order.id}`,
      checkoutUrl: `https://checkout.meermus.luxury/mock-pay?ref=${txnRef}`,
      instructions: 'Complete mock checkout or pass token="valid_token" to confirm.',
      metadata: { orderId: order.id, ...options },
    };
  }

  async verifyPayment(
    transactionReference: string,
    verificationPayload: any,
  ): Promise<PaymentVerificationResult> {
    // Server-side verification logic:
    // If token === 'fail_token' or status === 'failed', simulate payment decline
    if (verificationPayload?.token === 'fail_token' || verificationPayload?.simulateFailure) {
      return {
        success: false,
        transactionReference,
        amountVerified: 0,
        currency: 'PKR',
        failureReason: verificationPayload?.failureReason || 'Card declined / Insufficient funds',
        rawResponse: { gatewayStatus: 'DECLINED', code: 'INSUFFICIENT_FUNDS' },
      };
    }

    // Otherwise, simulate verified successful server confirmation
    const amount = Number(verificationPayload?.amount || 0);
    return {
      success: true,
      transactionReference,
      amountVerified: amount,
      currency: verificationPayload?.currency || 'PKR',
      gatewayTransactionId: `GW-${Date.now()}`,
      rawResponse: { gatewayStatus: 'CAPTURED', verifiedAt: new Date().toISOString() },
    };
  }

  async refundPayment(
    transactionReference: string,
    amount?: number,
  ): Promise<PaymentRefundResult> {
    return {
      success: true,
      refundReference: `REFUND-${transactionReference}`,
      amountRefunded: amount || 0,
    };
  }
}
