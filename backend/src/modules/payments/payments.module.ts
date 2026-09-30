import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MockGatewayProvider } from './providers/mock-gateway.provider';
import { StripePaymentProvider } from './providers/stripe.provider';
import { BankWirePaymentProvider } from './providers/bank-wire.provider';
import { AuditModule } from '../../common/services/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockGatewayProvider,
    StripePaymentProvider,
    BankWirePaymentProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
