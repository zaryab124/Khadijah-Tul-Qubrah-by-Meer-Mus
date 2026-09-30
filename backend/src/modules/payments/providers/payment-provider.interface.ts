export interface PaymentIntentResult {
  transactionReference: string;
  amount: number;
  currency: string;
  clientSecret?: string;
  checkoutUrl?: string;
  instructions?: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerificationResult {
  success: boolean;
  transactionReference: string;
  amountVerified: number;
  currency: string;
  gatewayTransactionId?: string;
  failureReason?: string;
  rawResponse?: any;
}

export interface PaymentRefundResult {
  success: boolean;
  refundReference: string;
  amountRefunded: number;
  failureReason?: string;
}

export interface PaymentProvider {
  readonly providerName: string;

  /**
   * Initializes a payment session or intent with the provider
   */
  createPaymentIntent(
    order: {
      id: string;
      orderNumber: string;
      totalAmount: number | string;
      currency: string;
      customer: { id: string; email: string; firstName: string; lastName: string };
    },
    options?: Record<string, any>,
  ): Promise<PaymentIntentResult>;

  /**
   * Server-side cryptographic or API confirmation of payment.
   * NEVER trust frontend payloads without validating with this method!
   */
  verifyPayment(
    transactionReference: string,
    verificationPayload: any,
  ): Promise<PaymentVerificationResult>;

  /**
   * Refunds a captured payment
   */
  refundPayment(
    transactionReference: string,
    amount?: number,
  ): Promise<PaymentRefundResult>;
}
