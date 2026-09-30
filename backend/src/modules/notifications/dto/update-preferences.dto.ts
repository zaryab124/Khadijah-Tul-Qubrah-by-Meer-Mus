import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: 'Receive email alerts for notifications' })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Receive mobile/web push notifications' })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Receive SMS updates where configured' })
  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Receive in-app notifications and badges' })
  @IsBoolean()
  @IsOptional()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Receive real-time order and production progress updates' })
  @IsBoolean()
  @IsOptional()
  orderUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Receive marketing and promotional announcements' })
  @IsBoolean()
  @IsOptional()
  marketingAlerts?: boolean;
}
