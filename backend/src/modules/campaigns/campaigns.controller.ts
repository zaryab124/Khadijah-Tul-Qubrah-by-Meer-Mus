import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole, CampaignStatus } from '@prisma/client';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Marketing Campaigns & Attribution Engine')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('track/:code')
  @ApiOperation({
    summary:
      'Public Campaign Link Resolution — Resolves incoming marketing link (?campaign_code=SUMMER26) and returns attribution payload for client cookie/session tracking',
  })
  async resolveCampaignCode(@Param('code') code: string) {
    return this.campaignsService.getCampaignByCode(code);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new marketing campaign with platform, code, budget and dates',
  })
  async createCampaign(@Body() dto: CreateCampaignDto, @Req() req: any) {
    return this.campaignsService.createCampaign(dto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all campaigns with platform and lifecycle status filters',
  })
  @ApiQuery({ name: 'status', enum: CampaignStatus, required: false })
  @ApiQuery({ name: 'platform', type: String, required: false })
  async listCampaigns(
    @Query('status') status?: CampaignStatus,
    @Query('platform') platform?: string,
  ) {
    return this.campaignsService.listCampaigns(status, platform);
  }

  @Get('platforms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'List configurable platforms (Facebook, Instagram, TikTok, WhatsApp, Website, Other, plus custom platforms)',
  })
  async listPlatforms() {
    return this.campaignsService.listPlatforms();
  }

  @Post('platforms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Configure a new advertising or social media platform for campaign attribution',
  })
  async createPlatform(@Body() dto: CreatePlatformDto, @Req() req: any) {
    return this.campaignsService.createPlatform(dto, req.user);
  }

  @Get('analytics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cross-campaign strategic attribution overview: total budgets, realized revenue, net profit, and ROI leaderboard',
  })
  async getOverviewAnalytics() {
    return this.campaignsService.getOverviewAnalytics();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retrieve single campaign metadata and aggregated conversion counts',
  })
  async getCampaignById(@Param('id') id: string) {
    return this.campaignsService.getCampaignById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update campaign properties, budget, schedule dates, or lifecycle status',
  })
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @Req() req: any,
  ) {
    return this.campaignsService.updateCampaign(id, dto, req.user);
  }

  @Get(':id/roi')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Campaign End-to-End Attribution & Realized ROI Report — Answers: Which campaign generated this customer? Which campaign generated orders? Which campaign generated revenue?',
  })
  async getCampaignAttributionAnalytics(@Param('id') id: string) {
    return this.campaignsService.getCampaignAttributionAnalytics(id);
  }
}
