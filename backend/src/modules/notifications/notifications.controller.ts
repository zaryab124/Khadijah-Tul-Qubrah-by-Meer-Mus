import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { TriggerNotificationEventDto } from './dto/trigger-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Centralized Notifications & Multi-Channel Dispatch')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications (Strict privacy isolated)' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  async getMyNotifications(
    @CurrentUser() user: any,
    @Query('isRead', new ParseBoolPipe({ optional: true })) isRead?: boolean,
  ) {
    return this.notificationsService.getUserNotifications(user.id, isRead);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get current unread notification count for badge display' })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read (Ownership verified)' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current authenticated user' })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user notification preferences across all 4 channels' })
  async getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getUserPreferences(user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences (channels & alert categories)' })
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updateUserPreferences(user.id, dto);
  }

  @Post('test-trigger')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin/Internal diagnostic tool to dispatch test event through service' })
  async triggerTestEvent(@Body() dto: TriggerNotificationEventDto) {
    return this.notificationsService.dispatch(dto);
  }
}
