import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({
    example: 'TXN-MOCK-ORD-202609-0001-1711234567890',
    description: 'Transaction reference received from payment initiation',
  })
  @IsNotEmpty()
  @IsString()
  transactionReference: string;

  @ApiPropertyOptional({
    description: 'Verification payload (e.g. Stripe client secret or token, webhook event, swift reference)',
  })
  @IsOptional()
  verificationPayload?: any;
}
