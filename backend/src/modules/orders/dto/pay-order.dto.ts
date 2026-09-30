import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class PayOrderDto {
  @ApiProperty({
    example: 'STRIPE',
    description: 'Payment provider: STRIPE, BANK_WIRE, MOCK_GATEWAY',
    default: 'MOCK_GATEWAY',
  })
  @IsNotEmpty()
  @IsString()
  paymentGateway: string = 'MOCK_GATEWAY';

  @ApiPropertyOptional({
    description: 'Optional metadata or provider options',
  })
  @IsOptional()
  providerOptions?: Record<string, any>;
}
