import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import {
  LeadStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import { CrmService } from './crm.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

describe('CrmService (Phase 8 — CRM, Leads & Agent Pipeline)', () => {
  let service: CrmService;
  let prismaService: any;
  let auditService: any;

  const mockAdmin = {
    id: 'admin-user-id',
    role: UserRole.ADMIN,
    email: 'admin@meermus.luxury',
  };

  const mockAgent1 = {
    id: 'agent-1-id',
    role: UserRole.AGENT,
    firstName: 'Fatima',
    lastName: 'Bibi',
    email: 'fatima@meermus.luxury',
  };

  const mockAgent2 = {
    id: 'agent-2-id',
    role: UserRole.AGENT,
    firstName: 'Zainab',
    lastName: 'Malik',
    email: 'zainab@meermus.luxury',
  };

  const mockCustomer = {
    id: 'cust-user-id',
    role: UserRole.CUSTOMER,
    email: 'client@example.com',
  };

  const mockLead = {
    id: 'lead-uuid-1',
    leadNumber: 'LED-202609-0001',
    assignedAgentId: mockAgent1.id,
    leadSource: 'WhatsApp',
    status: LeadStatus.ASSIGNED,
    priority: 'HIGH',
    firstName: 'Amina',
    lastName: 'Tariq',
    contactPhone: '+923001234567',
    contactEmail: 'amina.t@example.com',
    inquiryMessage: 'Bridal bespoke lehenga with zardozi handcrafting',
    estimatedValue: new Prisma.Decimal(450000),
    customerId: null,
    convertedOrderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaService = {
      lead: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(10),
      },
      leadActivity: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      agentProfile: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
      campaign: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        if (typeof cb === 'function') {
          return cb(prismaService);
        }
        return cb;
      }),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. createLead', () => {
    it('should ingest a new unassigned lead from WhatsApp with initial status NEW', async () => {
      const dto = {
        leadSource: 'WhatsApp',
        contactPhone: '+923001234567',
        firstName: 'Amina',
        lastName: 'Tariq',
        inquiryMessage: 'Bridal bespoke inquiry',
      };

      const createdLeadMock = {
        ...mockLead,
        id: 'new-lead-id',
        status: LeadStatus.NEW,
        assignedAgentId: null,
      };

      prismaService.lead.create.mockResolvedValue(createdLeadMock);
      prismaService.leadActivity.create.mockResolvedValue({ id: 'act-1' });

      const result = await service.createLead(dto as any);

      expect(result.id).toBe('new-lead-id');
      expect(prismaService.lead.create).toHaveBeenCalled();
      expect(prismaService.leadActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: 'NOTE',
            summary: 'Lead created from source: WhatsApp',
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_CREATED',
        }),
      );
    });

    it('should assign agent immediately if assignedAgentId is provided, incrementing agent active leads', async () => {
      const dto = {
        leadSource: 'Instagram',
        contactPhone: '+923219876543',
        firstName: 'Zoya',
        assignedAgentId: mockAgent1.id,
      };

      const createdLeadMock = {
        ...mockLead,
        id: 'lead-with-agent',
        status: LeadStatus.ASSIGNED,
        assignedAgentId: mockAgent1.id,
      };

      prismaService.lead.create.mockResolvedValue(createdLeadMock);
      prismaService.leadActivity.create.mockResolvedValue({ id: 'act-2' });
      prismaService.agentProfile.upsert.mockResolvedValue({ userId: mockAgent1.id, currentActiveLeads: 1 });

      const result = await service.createLead(dto as any, mockAdmin);

      expect(result.assignedAgentId).toBe(mockAgent1.id);
      expect(prismaService.agentProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockAgent1.id },
          update: { currentActiveLeads: { increment: 1 } },
        }),
      );
    });
  });

  describe('2. getLeadById & Strict Agent Isolation', () => {
    it('should allow assigned agent to view their lead', async () => {
      prismaService.lead.findUnique.mockResolvedValue(mockLead);

      const result = await service.getLeadById(mockLead.id, mockAgent1);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockLead.id);
    });

    it('should allow admin to view any lead', async () => {
      prismaService.lead.findUnique.mockResolvedValue(mockLead);

      const result = await service.getLeadById(mockLead.id, mockAdmin);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockLead.id);
    });

    it('STRICT ISOLATION: should reject unassigned agent with ForbiddenException', async () => {
      prismaService.lead.findUnique.mockResolvedValue(mockLead);

      await expect(service.getLeadById(mockLead.id, mockAgent2)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject customer or unauthorized role with ForbiddenException', async () => {
      prismaService.lead.findUnique.mockResolvedValue(mockLead);

      await expect(service.getLeadById(mockLead.id, mockCustomer)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if lead does not exist', async () => {
      prismaService.lead.findUnique.mockResolvedValue(null);

      await expect(service.getLeadById('non-existent', mockAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('3. listLeads with Agent Isolation', () => {
    it('should strictly filter leads by assignedAgentId when called by AGENT', async () => {
      prismaService.lead.findMany.mockResolvedValue([mockLead]);

      await service.listLeads(mockAgent1);

      expect(prismaService.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedAgentId: mockAgent1.id,
          }),
        }),
      );
    });

    it('should allow admin to query across all leads without assignedAgentId filter', async () => {
      prismaService.lead.findMany.mockResolvedValue([mockLead]);

      await service.listLeads(mockAdmin);

      expect(prismaService.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });

  describe('4. assignAgent & Reassignment Access Revocation', () => {
    it('should allow admin to reassign lead, decrementing old agent active workload and incrementing new agent', async () => {
      prismaService.lead.findUnique.mockResolvedValue(mockLead);
      prismaService.user.findUnique.mockResolvedValue(mockAgent2);
      prismaService.lead.update.mockResolvedValue({
        ...mockLead,
        assignedAgentId: mockAgent2.id,
      });
      prismaService.agentProfile.updateMany.mockResolvedValue({ count: 1 });
      prismaService.agentProfile.upsert.mockResolvedValue({ userId: mockAgent2.id, currentActiveLeads: 1 });
      prismaService.leadActivity.create.mockResolvedValue({ id: 'act-reassign' });

      const result = await service.assignAgent(mockLead.id, mockAdmin, {
        agentId: mockAgent2.id,
        notes: 'Transferred to bridal specialist agent',
      });

      expect(result.assignedAgentId).toBe(mockAgent2.id);
      // Decremented old agent
      expect(prismaService.agentProfile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockAgent1.id, currentActiveLeads: { gt: 0 } },
          data: { currentActiveLeads: { decrement: 1 } },
        }),
      );
      // Incremented new agent
      expect(prismaService.agentProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockAgent2.id },
          update: { currentActiveLeads: { increment: 1 } },
        }),
      );
      // Activity history logged
      expect(prismaService.leadActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: mockLead.id,
            activityType: 'STATUS_CHANGE',
            summary: expect.stringContaining('Lead reassigned to Zainab Malik'),
          }),
        }),
      );
    });

    it('should deny non-admin users from assigning or reassigning leads', async () => {
      await expect(
        service.assignAgent(mockLead.id, mockAgent1, { agentId: mockAgent2.id }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('REASSIGNMENT VERIFICATION: after reassignment, old agent loses access and new agent gains access', async () => {
      const reassignedLead = {
        ...mockLead,
        assignedAgentId: mockAgent2.id,
      };

      prismaService.lead.findUnique.mockResolvedValue(reassignedLead);

      // Old agent1 must now be rejected
      await expect(service.getLeadById(mockLead.id, mockAgent1)).rejects.toThrow(
        ForbiddenException,
      );

      // New agent2 must now be permitted
      const accessResult = await service.getLeadById(mockLead.id, mockAgent2);
      expect(accessResult.assignedAgentId).toBe(mockAgent2.id);
    });
  });

  describe('5. createLeadActivity', () => {
    it('should allow assigned agent to log a WhatsApp activity and advance status to CONTACTED', async () => {
      const leadInAssignedState = {
        ...mockLead,
        status: LeadStatus.ASSIGNED,
      };
      prismaService.lead.findUnique.mockResolvedValue(leadInAssignedState);
      prismaService.leadActivity.create.mockResolvedValue({
        id: 'act-3',
        activityType: 'WHATSAPP',
        summary: 'Sent bridal catalogue & fabric swatches',
      });
      prismaService.lead.update.mockResolvedValue({
        ...leadInAssignedState,
        status: LeadStatus.CONTACTED,
      });

      const result = await service.createLeadActivity(mockLead.id, mockAgent1, {
        activityType: 'WHATSAPP',
        summary: 'Sent bridal catalogue & fabric swatches',
        detailedNotes: 'Client responded positively, event date confirmed.',
      });

      expect(result.id).toBe('act-3');
      expect(prismaService.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockLead.id },
          data: { status: LeadStatus.CONTACTED },
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_ACTIVITY_CREATED',
        }),
      );
    });

    it('should prevent unrelated agent from logging activities on unassigned lead', async () => {
      prismaService.lead.findUnique.mockResolvedValue(mockLead);

      await expect(
        service.createLeadActivity(mockLead.id, mockAgent2, {
          activityType: 'CALL',
          summary: 'Attempted call',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('6. updateLeadStatus', () => {
    it('should allow assigned agent to transition lead to CUSTOM_REQUEST and log status change activity', async () => {
      prismaService.lead.findUnique.mockResolvedValue(mockLead);
      prismaService.lead.update.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.CUSTOM_REQUEST,
      });
      prismaService.leadActivity.create.mockResolvedValue({ id: 'act-status' });

      const result = await service.updateLeadStatus(mockLead.id, mockAgent1, {
        status: LeadStatus.CUSTOM_REQUEST,
        notes: 'Client submitted bespoke inspiration images',
      });

      expect(result.status).toBe(LeadStatus.CUSTOM_REQUEST);
      expect(prismaService.leadActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: 'STATUS_CHANGE',
            summary: 'Lead status updated to CUSTOM_REQUEST',
          }),
        }),
      );
    });
  });

  describe('7. convertLead', () => {
    it('should convert lead, link customerId and convertedOrderId, and decrement active leads count', async () => {
      prismaService.lead.findUnique.mockResolvedValue(mockLead);
      prismaService.lead.update.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.CONVERTED,
        customerId: 'customer-123',
        convertedOrderId: 'order-999',
      });
      prismaService.agentProfile.updateMany.mockResolvedValue({ count: 1 });
      prismaService.leadActivity.create.mockResolvedValue({ id: 'act-converted' });

      const result = await service.convertLead(mockLead.id, mockAgent1, {
        customerId: 'customer-123',
        convertedOrderId: 'order-999',
        notes: 'Converted through accepted bespoke quotation V2',
      });

      expect(result.status).toBe(LeadStatus.CONVERTED);
      expect(prismaService.agentProfile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockAgent1.id, currentActiveLeads: { gt: 0 } },
          data: { currentActiveLeads: { decrement: 1 } },
        }),
      );
      expect(prismaService.leadActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: 'STATUS_CHANGE',
            summary: expect.stringContaining('Lead converted successfully'),
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_CONVERTED',
          entityId: mockLead.id,
        }),
      );
    });
  });

  describe('8. getAgentDashboard (7 Pipeline Queues & Metrics)', () => {
    it('should return metrics and isolated queues for assigned agent', async () => {
      prismaService.lead.findMany
        .mockResolvedValueOnce([mockLead]) // todaysLeads
        .mockResolvedValueOnce([mockLead]) // newLeads
        .mockResolvedValueOnce([]) // followUps
        .mockResolvedValueOnce([]) // interestedLeads
        .mockResolvedValueOnce([]) // customRequests
        .mockResolvedValueOnce([]) // quotes
        .mockResolvedValueOnce([]); // conversions

      const dashboard = await service.getAgentDashboard(mockAgent1);

      expect(dashboard).toBeDefined();
      expect(dashboard.metrics.todaysLeadsCount).toBe(1);
      expect(dashboard.metrics.newLeadsCount).toBe(1);
      expect(dashboard.queues.todaysLeads).toHaveLength(1);
    });

    it('should reject unauthorized role (CUSTOMER) with ForbiddenException', async () => {
      await expect(service.getAgentDashboard(mockCustomer)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('9. updateAgentProfile', () => {
    it('should allow agent to update their own profile', async () => {
      prismaService.agentProfile.upsert.mockResolvedValue({
        userId: mockAgent1.id,
        maxActiveLeads: 40,
        isAvailable: true,
      });

      const updated = await service.updateAgentProfile(mockAgent1.id, mockAgent1, {
        maxActiveLeads: 40,
        isAvailable: true,
      });

      expect(updated.maxActiveLeads).toBe(40);
    });

    it('should prevent one agent from modifying another agent profile', async () => {
      await expect(
        service.updateAgentProfile(mockAgent2.id, mockAgent1, {
          maxActiveLeads: 50,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to modify any agent profile', async () => {
      prismaService.agentProfile.upsert.mockResolvedValue({
        userId: mockAgent2.id,
        maxActiveLeads: 50,
      });

      const updated = await service.updateAgentProfile(mockAgent2.id, mockAdmin, {
        maxActiveLeads: 50,
      });

      expect(updated.maxActiveLeads).toBe(50);
    });
  });
});
