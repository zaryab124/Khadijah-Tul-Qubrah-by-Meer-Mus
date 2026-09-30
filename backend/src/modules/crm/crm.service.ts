import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  LeadStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * 1. Ingest / Create a new CRM Lead across marketing campaigns and digital channels
   */
  async createLead(dto: CreateLeadDto, user?: any) {
    const leadNumber = await this.generateLeadNumber();

    // Check optional marketing campaign attribution
    let campaignId = dto.campaignId;
    const trackingCode = dto.campaignCode || dto.utmCampaign;
    if (!campaignId && trackingCode) {
      const campaign = await this.prisma.campaign.findFirst({
        where: {
          OR: [
            { campaignCode: trackingCode.toUpperCase().trim() },
            { utmCampaign: trackingCode },
          ],
        },
      });
      if (campaign) {
        campaignId = campaign.id;
      }
    }

    const initialStatus = dto.assignedAgentId ? LeadStatus.ASSIGNED : LeadStatus.NEW;

    const lead = await this.prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          leadNumber,
          campaignId: campaignId || null,
          assignedAgentId: dto.assignedAgentId || null,
          leadSource: dto.leadSource || 'Website',
          status: initialStatus,
          priority: dto.priority || 'MEDIUM',
          firstName: dto.firstName || null,
          lastName: dto.lastName || null,
          contactPhone: dto.contactPhone,
          contactEmail: dto.contactEmail || null,
          inquiryMessage: dto.inquiryMessage || null,
          estimatedValue: dto.estimatedValue ? new Prisma.Decimal(dto.estimatedValue) : null,
        },
        include: {
          campaign: true,
          assignedAgent: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Initial activity log
      await tx.leadActivity.create({
        data: {
          leadId: createdLead.id,
          agentId: dto.assignedAgentId || user?.id || createdLead.id, // Fallback agent reference
          activityType: 'NOTE',
          summary: `Lead created from source: ${dto.leadSource || 'Website'}`,
          detailedNotes: dto.inquiryMessage || 'New prospective customer inquiry received.',
        },
      });

      if (dto.assignedAgentId) {
        await tx.agentProfile.upsert({
          where: { userId: dto.assignedAgentId },
          update: { currentActiveLeads: { increment: 1 } },
          create: {
            userId: dto.assignedAgentId,
            currentActiveLeads: 1,
          },
        });
      }

      return createdLead;
    });

    await this.auditService.logAction({
      actorId: user?.id || null,
      action: 'LEAD_CREATED',
      entityTable: 'leads',
      entityId: lead.id,
      newState: {
        leadNumber: lead.leadNumber,
        source: lead.leadSource,
        phone: lead.contactPhone,
      },
    });

    return lead;
  }

  /**
   * 2. Get Lead Details by ID with strict Agent Isolation Guard
   */
  async getLeadById(leadId: string, user: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        campaign: true,
        assignedAgent: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            agent: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead "${leadId}" not found`);
    }

    // STRICT AGENT ISOLATION: Agents can only access assigned leads
    this.assertLeadAccess(lead, user);

    return lead;
  }

  /**
   * 3. List Leads (Agents strictly see only assigned leads; Admins see all)
   */
  async listLeads(user: any, status?: LeadStatus, source?: string) {
    const where: Prisma.LeadWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (source) {
      where.leadSource = source;
    }

    if (user.role === UserRole.AGENT) {
      where.assignedAgentId = user.id;
    }

    return this.prisma.lead.findMany({
      where,
      include: {
        campaign: { select: { title: true, utmCampaign: true } },
        assignedAgent: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { activities: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 4. Assign or Reassign Lead to an Agent
   * When reassigning, old agent loses access and new agent gains access.
   */
  async assignAgent(leadId: string, user: any, dto: AssignAgentDto) {
    this.assertAdminOrManager(user);

    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { assignedAgent: true },
    });

    if (!lead) {
      throw new NotFoundException(`Lead "${leadId}" not found`);
    }

    const newAgent = await this.prisma.user.findUnique({
      where: { id: dto.agentId },
    });

    if (!newAgent) {
      throw new NotFoundException(`Agent user "${dto.agentId}" not found`);
    }

    const oldAgentId = lead.assignedAgentId;

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update lead assignedAgentId
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          assignedAgentId: newAgent.id,
          status: lead.status === LeadStatus.NEW ? LeadStatus.ASSIGNED : lead.status,
        },
        include: {
          assignedAgent: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      // 2. Adjust active lead counters
      if (oldAgentId) {
        await tx.agentProfile.updateMany({
          where: { userId: oldAgentId, currentActiveLeads: { gt: 0 } },
          data: { currentActiveLeads: { decrement: 1 } },
        });
      }

      await tx.agentProfile.upsert({
        where: { userId: newAgent.id },
        update: { currentActiveLeads: { increment: 1 } },
        create: {
          userId: newAgent.id,
          currentActiveLeads: 1,
        },
      });

      // 3. Log lead activity history
      await tx.leadActivity.create({
        data: {
          leadId,
          agentId: newAgent.id,
          activityType: 'STATUS_CHANGE',
          summary: oldAgentId
            ? `Lead reassigned to ${newAgent.firstName} ${newAgent.lastName}`
            : `Lead assigned to ${newAgent.firstName} ${newAgent.lastName}`,
          detailedNotes: dto.notes || 'Agent assignment updated by administration.',
        },
      });

      return updatedLead;
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'LEAD_REASSIGNED',
      entityTable: 'leads',
      entityId: leadId,
      previousState: { assignedAgentId: oldAgentId },
      newState: { assignedAgentId: newAgent.id },
    });

    return updated;
  }

  /**
   * 5. Create Lead Activity (Call, WhatsApp, Email, Meeting, Note)
   */
  async createLeadActivity(leadId: string, user: any, dto: CreateLeadActivityDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead "${leadId}" not found`);
    }

    this.assertLeadAccess(lead, user);

    const activity = await this.prisma.$transaction(async (tx) => {
      const created = await tx.leadActivity.create({
        data: {
          leadId,
          agentId: user.id,
          activityType: dto.activityType,
          summary: dto.summary,
          detailedNotes: dto.detailedNotes || null,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          completedAt: dto.completedAt ? new Date(dto.completedAt) : new Date(),
        },
        include: {
          agent: { select: { firstName: true, lastName: true } },
        },
      });

      // Advance status to CONTACTED if in NEW or ASSIGNED
      if (
        lead.status === LeadStatus.NEW ||
        lead.status === LeadStatus.ASSIGNED
      ) {
        await tx.lead.update({
          where: { id: leadId },
          data: { status: LeadStatus.CONTACTED },
        });
      }

      return created;
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'LEAD_ACTIVITY_CREATED',
      entityTable: 'lead_activities',
      entityId: activity.id,
      newState: {
        leadId,
        activityType: dto.activityType,
        summary: dto.summary,
      },
    });

    return activity;
  }

  /**
   * 6. Get Complete Activity History for a Lead
   */
  async getLeadActivities(leadId: string, user: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead "${leadId}" not found`);
    }

    this.assertLeadAccess(lead, user);

    return this.prisma.leadActivity.findMany({
      where: { leadId },
      include: {
        agent: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 7. Update Lead Pipeline Status
   */
  async updateLeadStatus(leadId: string, user: any, dto: UpdateLeadStatusDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead "${leadId}" not found`);
    }

    this.assertLeadAccess(lead, user);

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.lead.update({
        where: { id: leadId },
        data: {
          status: dto.status,
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId,
          agentId: user.id,
          activityType: 'STATUS_CHANGE',
          summary: `Lead status updated to ${dto.status}`,
          detailedNotes: dto.notes || null,
        },
      });

      return res;
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'LEAD_STATUS_UPDATED',
      entityTable: 'leads',
      entityId: leadId,
      previousState: { status: lead.status },
      newState: { status: dto.status },
    });

    return updated;
  }

  /**
   * 8. Convert Lead (Link to customer and/or order)
   */
  async convertLead(leadId: string, user: any, dto: ConvertLeadDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead "${leadId}" not found`);
    }

    this.assertLeadAccess(lead, user);

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.CONVERTED,
          convertedAt: new Date(),
          customerId: dto.customerId || lead.customerId || null,
          convertedOrderId: dto.convertedOrderId || null,
        },
      });

      // Free up active lead slot on agent profile
      if (lead.assignedAgentId) {
        await tx.agentProfile.updateMany({
          where: { userId: lead.assignedAgentId, currentActiveLeads: { gt: 0 } },
          data: { currentActiveLeads: { decrement: 1 } },
        });
      }

      // Preserve End-to-End Campaign Attribution: Campaign -> Lead -> Customer & Order
      if (dto.customerId && lead.campaignId) {
        await tx.customerProfile.upsert({
          where: { userId: dto.customerId },
          update: {
            originCampaignId: lead.campaignId,
            originLeadId: lead.id,
          },
          create: {
            userId: dto.customerId,
            originCampaignId: lead.campaignId,
            originLeadId: lead.id,
          },
        });
      }

      if (dto.convertedOrderId && lead.campaignId) {
        await tx.order.update({
          where: { id: dto.convertedOrderId },
          data: {
            originCampaignId: lead.campaignId,
            originLeadId: lead.id,
          },
        });
      }

      await tx.leadActivity.create({
        data: {
          leadId,
          agentId: user.id,
          activityType: 'STATUS_CHANGE',
          summary: `Lead converted successfully. Linked to customer ${dto.customerId || 'created'} / order ${dto.convertedOrderId || 'N/A'}.`,
          detailedNotes: dto.notes || 'Conversion closed by sales agent.',
        },
      });

      return res;
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'LEAD_CONVERTED',
      entityTable: 'leads',
      entityId: leadId,
      newState: {
        status: LeadStatus.CONVERTED,
        customerId: dto.customerId,
        convertedOrderId: dto.convertedOrderId,
      },
    });

    return updated;
  }

  /**
   * 9. Agent Dashboard: Today's leads, new leads, follow-ups, interested, custom requests, quotes, conversions
   */
  async getAgentDashboard(user: any) {
    this.assertAgentOrAdmin(user);

    const isAgent = user.role === UserRole.AGENT;
    const filter = isAgent ? { assignedAgentId: user.id } : {};

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      todaysLeads,
      newLeads,
      followUps,
      interestedLeads,
      customRequests,
      quotes,
      conversions,
    ] = await Promise.all([
      // 1. Today's leads
      this.prisma.lead.findMany({
        where: {
          ...filter,
          createdAt: { gte: startOfToday },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // 2. New leads (unassigned or newly assigned)
      this.prisma.lead.findMany({
        where: {
          ...filter,
          status: { in: [LeadStatus.NEW, LeadStatus.ASSIGNED] },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // 3. Follow-ups (leads with future or today's scheduled activities)
      this.prisma.lead.findMany({
        where: {
          ...filter,
          activities: {
            some: {
              scheduledAt: { gte: startOfToday },
            },
          },
        },
        include: {
          activities: {
            where: { scheduledAt: { gte: startOfToday } },
            orderBy: { scheduledAt: 'asc' },
            take: 1,
          },
        },
      }),

      // 4. Interested leads
      this.prisma.lead.findMany({
        where: {
          ...filter,
          status: LeadStatus.INTERESTED,
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // 5. Custom requests
      this.prisma.lead.findMany({
        where: {
          ...filter,
          status: LeadStatus.CUSTOM_REQUEST,
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // 6. Quotes sent / In negotiation
      this.prisma.lead.findMany({
        where: {
          ...filter,
          status: { in: [LeadStatus.QUOTE_SENT, LeadStatus.NEGOTIATION] },
        },
        orderBy: { updatedAt: 'desc' },
      }),

      // 7. Conversions
      this.prisma.lead.findMany({
        where: {
          ...filter,
          status: LeadStatus.CONVERTED,
        },
        orderBy: { convertedAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      metrics: {
        todaysLeadsCount: todaysLeads.length,
        newLeadsCount: newLeads.length,
        followUpsCount: followUps.length,
        interestedCount: interestedLeads.length,
        customRequestsCount: customRequests.length,
        quotesCount: quotes.length,
        conversionsCount: conversions.length,
      },
      queues: {
        todaysLeads,
        newLeads,
        followUps,
        interestedLeads,
        customRequests,
        quotes,
        conversions,
      },
    };
  }

  /**
   * 10. List Agents with availability and active workload
   */
  async listAgents() {
    return this.prisma.user.findMany({
      where: { role: UserRole.AGENT, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        agentProfile: true,
      },
    });
  }

  /**
   * 11. Update Agent Profile
   */
  async updateAgentProfile(agentUserId: string, user: any, dto: UpdateAgentProfileDto) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN && user.id !== agentUserId) {
      throw new ForbiddenException('Access denied: You cannot modify another agent profile.');
    }

    return this.prisma.agentProfile.upsert({
      where: { userId: agentUserId },
      update: {
        ...(dto.maxActiveLeads !== undefined && { maxActiveLeads: dto.maxActiveLeads }),
        ...(dto.commissionRate !== undefined && { commissionRate: new Prisma.Decimal(dto.commissionRate) }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      },
      create: {
        userId: agentUserId,
        maxActiveLeads: dto.maxActiveLeads || 30,
        commissionRate: new Prisma.Decimal(dto.commissionRate || 0),
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  // --- ACCESS CONTROL GUARDS ---

  private assertLeadAccess(lead: any, user: any) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.AGENT) {
      if (lead.assignedAgentId !== user.id) {
        throw new ForbiddenException(
          'Access denied: You are not the assigned sales agent for this lead.',
        );
      }
      return;
    }

    throw new ForbiddenException('Access denied: Unauthorized role.');
  }

  private assertAdminOrManager(user: any) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Access denied: Only administrators can assign or reassign leads.',
      );
    }
  }

  private assertAgentOrAdmin(user: any) {
    if (
      user.role !== UserRole.AGENT &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Access denied: Only sales agents and administrators can access the CRM dashboard.',
      );
    }
  }

  private async generateLeadNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
    const count = await this.prisma.lead.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `LED-${yearMonth}-${seq}`;
  }
}
