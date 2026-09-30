import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ConfirmPaymentDto } from '../orders/dto/confirm-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Payments & Gateway Verifications')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Server-side payment verification (Validates provider signature/token, prevents duplicate callbacks, advances order to PAID)',
  })
  async verifyOrderPayment(
    @Param('id') orderId: string,
    @Body() dto: ConfirmPaymentDto,
    @Req() req: any,
  ) {
    return this.paymentsService.verifyPayment(orderId, req.user, dto);
  }
}
