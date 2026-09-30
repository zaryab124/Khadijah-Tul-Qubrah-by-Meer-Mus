import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateLeadActivityDto {
  @ApiProperty({
    example: 'WHATSAPP',
    enum: ['CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'NOTE', 'STATUS_CHANGE'],
    description: 'Type of communication or action taken with the customer',
  })
  @IsNotEmpty()
  @IsString()
  activityType: string;

  @ApiProperty({
    example: 'Sent lookbook and fabric swatches via WhatsApp',
    description: 'Concise summary of interaction',
  })
  @IsNotEmpty()
  @IsString()
  summary: string;

  @ApiPropertyOptional({
    example: 'Customer loved the bottle green pure katan silk swatch. Requested quotation for zardozi neckline.',
    description: 'Detailed interaction or meeting notes',
  })
  @IsOptional()
  @IsString()
  detailedNotes?: string;

  @ApiPropertyOptional({
    example: '2026-10-05T14:00:00.000Z',
    description: 'Scheduled follow-up reminder date and time',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    example: '2026-09-30T10:30:00.000Z',
    description: 'Completion date and time if activity is already finished',
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
