import { Injectable } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentIntentResult,
  PaymentVerificationResult,
  PaymentRefundResult,
} from './payment-provider.interface';

@Injectable()
export class BankWirePaymentProvider implements PaymentProvider {
  readonly providerName = 'BANK_WIRE';

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
    const txnRef = `WIRE-${order.orderNumber}-${Date.now()}`;
    return {
      transactionReference: txnRef,
      amount: Number(order.totalAmount),
      currency: order.currency || 'PKR',
      instructions:
        'Please wire the total amount to: Bank Alfalah Islamic | Title: KHADIJAH-TUL-QUBRAH BY MEER&MUS | IBAN: PK36ALFH0001001234567890 | Reference: ' +
        order.orderNumber,
      metadata: { orderId: order.id, ...options },
    };
  }

  async verifyPayment(
    transactionReference: string,
    verificationPayload: any,
  ): Promise<PaymentVerificationResult> {
    // Admin or Finance officer confirms wire transfer remittance receipt
    if (verificationPayload?.confirmedByStaff || verificationPayload?.swiftReference) {
      return {
        success: true,
        transactionReference,
        amountVerified: Number(verificationPayload.amount || 0),
        currency: verificationPayload.currency || 'PKR',
        gatewayTransactionId: verificationPayload.swiftReference || `WIRE-CONF-${Date.now()}`,
        rawResponse: verificationPayload,
      };
    }

    return {
      success: false,
      transactionReference,
      amountVerified: 0,
      currency: 'PKR',
      failureReason: 'Bank wire remittance not yet reconciled or rejected',
      rawResponse: verificationPayload,
    };
  }

  async refundPayment(
    transactionReference: string,
    amount?: number,
  ): Promise<PaymentRefundResult> {
    return {
      success: true,
      refundReference: `WIRE-REF-${transactionReference}`,
      amountRefunded: amount || 0,
    };
  }
}
