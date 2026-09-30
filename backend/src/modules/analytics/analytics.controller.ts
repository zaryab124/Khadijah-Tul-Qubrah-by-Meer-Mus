import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Business Intelligence & Verified Database Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Master business analytics report compiling all 6 core business domains' })
  async getOverview() {
    return this.analyticsService.getFullBusinessReport();
  }

  @Get('customers')
  @ApiOperation({ summary: 'Customer acquisition and retention metrics (New vs Returning customers, repeat rate)' })
  async getCustomerAnalytics() {
    return this.analyticsService.getCustomerAnalytics();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Actual time-series sales metrics aggregated Daily, Weekly, and Monthly' })
  async getSalesAnalytics() {
    return this.analyticsService.getSalesAnalytics();
  }

  @Get('custom-design')
  @ApiOperation({ summary: 'Bespoke design studio funnel: Requests, Quotes, Acceptance, and Conversion Rate' })
  async getCustomDesignAnalytics() {
    return this.analyticsService.getCustomDesignAnalytics();
  }

  @Get('crm')
  @ApiOperation({ summary: 'CRM metrics: Total leads, lead source distribution, agent activity and conversions' })
  async getCrmAnalytics() {
    return this.analyticsService.getCrmAnalytics();
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Campaign performance: Leads, orders, and realized revenue with external ad metrics distinction' })
  async getCampaignAnalytics() {
    return this.analyticsService.getCampaignAnalytics();
  }

  @Get('production')
  @ApiOperation({ summary: 'Atelier production: Average crafting duration, pending, completed, and delayed jobs' })
  async getProductionAnalytics() {
    return this.analyticsService.getProductionAnalytics();
  }
}
