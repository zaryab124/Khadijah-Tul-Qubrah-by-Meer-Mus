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
import { UserRole, LeadStatus } from '@prisma/client';
import { CrmService } from './crm.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Fashion CRM & Sales Agent Pipeline')
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post('leads')
  @ApiOperation({
    summary:
      'Ingest or create a new prospective lead from digital channels (Website, App, Instagram, WhatsApp, TikTok, Ads, Referral, or Manual entry)',
  })
  async createLead(@Body() dto: CreateLeadDto, @Req() req: any) {
    return this.crmService.createLead(dto, req.user);
  }

  @Get('leads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'List CRM pipeline leads. Strict isolation: Agents only view their assigned leads; Admins see all leads.',
  })
  @ApiQuery({ name: 'status', enum: LeadStatus, required: false })
  @ApiQuery({ name: 'source', type: String, required: false })
  async listLeads(
    @Req() req: any,
    @Query('status') status?: LeadStatus,
    @Query('source') source?: string,
  ) {
    return this.crmService.listLeads(req.user, status, source);
  }

  @Get('agent/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Agent Dashboard metrics & 7 pipeline queues: Today's leads, New leads, Follow-ups, Interested, Custom requests, Quotes, and Conversions",
  })
  async getAgentDashboard(@Req() req: any) {
    return this.crmService.getAgentDashboard(req.user);
  }

  @Get('agents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List luxury sales agents with active workload, capacity and availability status',
  })
  async listAgents() {
    return this.crmService.listAgents();
  }

  @Patch('agents/:id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update sales agent profile (maximum active leads capacity, commission rate, availability)',
  })
  async updateAgentProfile(
    @Param('id') id: string,
    @Body() dto: UpdateAgentProfileDto,
    @Req() req: any,
  ) {
    return this.crmService.updateAgentProfile(id, req.user, dto);
  }

  @Get('leads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Retrieve single lead details, marketing attribution, notes, and activity timeline. Enforces agent isolation guard.',
  })
  async getLeadById(@Param('id') id: string, @Req() req: any) {
    return this.crmService.getLeadById(id, req.user);
  }

  @Post('leads/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Assign or reassign lead to a sales agent. Automatically revokes old agent access and logs assignment activity.',
  })
  async assignAgent(
    @Param('id') id: string,
    @Body() dto: AssignAgentDto,
    @Req() req: any,
  ) {
    return this.crmService.assignAgent(id, req.user, dto);
  }

  @Post('leads/:id/activities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Log an interaction activity (Call, WhatsApp, Email, In-Person Meeting, Note, Status change, or Follow-up schedule)',
  })
  async createLeadActivity(
    @Param('id') id: string,
    @Body() dto: CreateLeadActivityDto,
    @Req() req: any,
  ) {
    return this.crmService.createLeadActivity(id, req.user, dto);
  }

  @Get('leads/:id/activities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get chronological activity history and contact log for a lead',
  })
  async getLeadActivities(@Param('id') id: string, @Req() req: any) {
    return this.crmService.getLeadActivities(id, req.user);
  }

  @Patch('leads/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update lead pipeline status (CONTACTED, INTERESTED, CUSTOM_REQUEST, QUOTE_SENT, NEGOTIATION, LOST, CLOSED)',
  })
  async updateLeadStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @Req() req: any,
  ) {
    return this.crmService.updateLeadStatus(id, req.user, dto);
  }

  @Post('leads/:id/convert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Convert lead into active customer and/or completed bespoke order, freeing up agent workload slot',
  })
  async convertLead(
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
    @Req() req: any,
  ) {
    return this.crmService.convertLead(id, req.user, dto);
  }
}
