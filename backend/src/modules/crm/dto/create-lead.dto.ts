import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({
    example: '+923001234567',
    description: 'Customer contact phone number (primary lead identifier for WhatsApp / Calls)',
  })
  @IsNotEmpty()
  @IsString()
  contactPhone: string;

  @ApiPropertyOptional({ example: 'Ayesha' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Malik' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'ayesha.malik@example.com' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({
    example: 'Instagram',
    description:
      'Lead source: Website, App, Instagram, Facebook, TikTok, WhatsApp, Campaign, Referral, Manual, Advertisement, Other',
    default: 'Website',
  })
  @IsOptional()
  @IsString()
  leadSource?: string = 'Website';

  @ApiPropertyOptional({
    example: 'campaign-uuid-1234',
    description: 'Associated marketing campaign ID if originated from a campaign ad',
  })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({
    example: 'SUMMER26',
    description: 'Campaign tracking code from marketing link',
  })
  @IsOptional()
  @IsString()
  campaignCode?: string;

  @ApiPropertyOptional({
    example: 'bridal_couture_winter_2026',
    description: 'UTM campaign identifier for marketing attribution',
  })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @ApiPropertyOptional({
    example: 'Interested in bespoke emerald velvet peshwas for December wedding reception.',
  })
  @IsOptional()
  @IsString()
  inquiryMessage?: string;

  @ApiPropertyOptional({
    example: 'HIGH',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
  })
  @IsOptional()
  @IsString()
  priority?: string = 'MEDIUM';

  @ApiPropertyOptional({
    example: 185000,
    description: 'Estimated opportunity / quotation value in PKR',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional({
    example: 'agent-uuid-5678',
    description: 'Optional pre-assigned agent user ID',
  })
  @IsOptional()
  @IsString()
  assignedAgentId?: string;
}
