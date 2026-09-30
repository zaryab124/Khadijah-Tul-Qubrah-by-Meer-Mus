import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackCampaignDto {
  @ApiProperty({
    description: 'Campaign tracking code from marketing link (e.g. SUMMER26)',
    example: 'SUMMER26',
  })
  @IsString()
  @IsNotEmpty()
  campaignCode: string;

  @ApiPropertyOptional({
    description: 'Optional anonymous visitor or session identifier',
    example: 'anon-session-9876',
  })
  @IsString()
  @IsOptional()
  visitorId?: string;

  @ApiPropertyOptional({
    description: 'HTTP Referrer header or deep link origin',
    example: 'https://instagram.com/p/Cxyz123',
  })
  @IsString()
  @IsOptional()
  referrer?: string;
}
