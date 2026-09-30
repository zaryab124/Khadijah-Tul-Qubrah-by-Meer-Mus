import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Campaign display and marketing name',
    example: 'Summer Luxury Lawn & Velvet Preview 2026',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Configurable digital platform (Facebook, Instagram, TikTok, WhatsApp, Website, Other)',
    example: 'Instagram',
  })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({
    description: 'Unique tracking campaign code used in marketing query parameters (e.g. ?campaign_code=SUMMER26)',
    example: 'SUMMER26',
  })
  @IsString()
  @IsNotEmpty()
  campaignCode: string;

  @ApiProperty({
    description: 'Allocated marketing expenditure budget in PKR',
    example: 250000.0,
  })
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiPropertyOptional({
    description: 'Campaign lifecycle status (DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED)',
    enum: CampaignStatus,
    default: CampaignStatus.ACTIVE,
  })
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;

  @ApiPropertyOptional({
    description: 'Campaign launch start date',
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Campaign termination end date',
    example: '2026-08-31T23:59:59.000Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Internal campaign brief, target audience, and strategic notes',
    example: 'Targeting overseas Pakistani diaspora in UK/US/UAE for bespoke festive bespoke pre-orders.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional UTM source parameter (e.g. meta, tiktok, influencer)',
    example: 'instagram_reels',
  })
  @IsString()
  @IsOptional()
  utmSource?: string;

  @ApiPropertyOptional({
    description: 'Optional UTM medium parameter (e.g. cpc, bio, story)',
    example: 'story_swipeup',
  })
  @IsString()
  @IsOptional()
  utmMedium?: string;
}
