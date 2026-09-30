import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { UserRole, OrderStatus, CustomRequestStatus } from '@prisma/client';

describe('AdminService (Phase 11 — Admin Control Center)', () => {
  let service: AdminService;
  let prisma: any;
  let auditService: any;

  const mockSuperAdmin = {
    id: 'super-admin-uuid-1',
    role: UserRole.SUPER_ADMIN,
    email: 'super@meermus.luxury',
  };

  const mockAdmin = {
    id: 'admin-uuid-2',
    role: UserRole.ADMIN,
    email: 'admin@meermus.luxury',
  };

  const mockCustomer = {
    id: 'cust-uuid-3',
    role: UserRole.CUSTOMER,
    email: 'client@example.com',
    isActive: true,
  };

  beforeEach(async () => {
    prisma = {
      order: {
        aggregate: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      customDesignRequest: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      quotation: {
        count: jest.fn(),
      },
      lead: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      productionJob: {
        count: jest.fn(),
      },
      user: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      category: { count: jest.fn() },
      colour: { count: jest.fn() },
      size: { count: jest.fn() },
      sizeChart: { count: jest.fn() },
      fabric: { count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      craftOption: { count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      product: { count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      campaignPlatform: { count: jest.fn() },
      campaign: { count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      brand: { findFirst: jest.fn() },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };


    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('getDashboardSummary', () => {
    it('should aggregate live KPIs for sales, orders, atelier, leads and staff', async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 1850000 },
        _count: { id: 12 },
      });
      prisma.order.count.mockResolvedValue(15);
      prisma.customDesignRequest.count.mockResolvedValue(8);
      prisma.quotation.count.mockResolvedValue(5);
      prisma.lead.count.mockResolvedValue(22);
      prisma.productionJob.count.mockResolvedValue(7);
      prisma.user.count.mockResolvedValue(10);
      prisma.order.findMany.mockResolvedValue([]);
      prisma.customDesignRequest.findMany.mockResolvedValue([]);
      prisma.lead.findMany.mockResolvedValue([]);
      prisma.auditLog.findMany.mockResolvedValue([]);

      const result = await service.getDashboardSummary();

      expect(result.kpi.totalSales).toBe(1850000);
      expect(result.kpi.totalSalesFormatted).toContain('PKR');
      expect(result.kpi.orders.total).toBe(15);
      expect(result.kpi.customRequests.total).toBe(8);
      expect(result.kpi.pendingQuotes).toBe(5);
      expect(result.kpi.leads.total).toBe(22);
      expect(result.kpi.productionJobs.total).toBe(7);
      expect(prisma.order.aggregate).toHaveBeenCalled();
    });
  });

  describe('User Management & RBAC Protection', () => {
    it('should reject non-super-admin attempting privilege escalation to ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(mockCustomer);

      await expect(
        service.updateUserRole(
          mockCustomer.id,
          { role: UserRole.ADMIN },
          mockAdmin, // Regular ADMIN attempting to promote to ADMIN
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(auditService.logAction).not.toHaveBeenCalled();
    });

    it('should allow SUPER_ADMIN to assign roles and record audit log', async () => {
      prisma.user.findUnique.mockResolvedValue(mockCustomer);
      prisma.user.update.mockResolvedValue({
        ...mockCustomer,
        role: UserRole.DESIGNER,
      });

      const res = await service.updateUserRole(
        mockCustomer.id,
        { role: UserRole.DESIGNER, reason: 'Promoted to atelier designer' },
        mockSuperAdmin,
      );

      expect(res.role).toBe(UserRole.DESIGNER);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockCustomer.id },
        data: { role: UserRole.DESIGNER },
        select: expect.any(Object),
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockSuperAdmin.id,
          action: 'USER_ROLE_UPDATED',
          entityTable: 'users',
          entityId: mockCustomer.id,
        }),
      );
    });

    it('should prevent user from deactivating their own account', async () => {
      prisma.user.findUnique.mockResolvedValue(mockAdmin);

      await expect(
        service.updateUserStatus(mockAdmin.id, { isActive: false }, mockAdmin),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should allow deactivating customer with audit log', async () => {
      prisma.user.findUnique.mockResolvedValue(mockCustomer);
      prisma.user.update.mockResolvedValue({ ...mockCustomer, isActive: false });

      const res = await service.updateUserStatus(
        mockCustomer.id,
        { isActive: false, reason: 'Account suspended per policy' },
        mockAdmin,
      );

      expect(res.isActive).toBe(false);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockAdmin.id,
          action: 'USER_STATUS_UPDATED',
          entityTable: 'users',
        }),
      );
    });
  });

  describe('Controlled Destruction & Safety Guard', () => {
    it('should safely deactivate product and record audit log', async () => {
      const mockProd = { id: 'prod-1', title: 'Velvet Anarkali', isActive: true };
      prisma.product.findUnique.mockResolvedValue(mockProd);
      prisma.product.update.mockResolvedValue({ ...mockProd, isActive: false });

      const res = await service.deleteEntitySafely(
        'products',
        'prod-1',
        mockAdmin,
        'Discontinued item',
      );

      expect(res.success).toBe(true);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { isActive: false },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONTROLLED_DESTRUCTION_PRODUCTS',
          entityTable: 'products',
          entityId: 'prod-1',
        }),
      );
    });


    it('should throw NotFoundException if entity does not exist', async () => {
      prisma.fabric.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteEntitySafely('fabrics', 'non-existent', mockAdmin),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getConfigSummary', () => {
    it('should return summary of configurable business entities', async () => {
      prisma.category.count.mockResolvedValue(5);
      prisma.colour.count.mockResolvedValue(12);
      prisma.size.count.mockResolvedValue(6);
      prisma.sizeChart.count.mockResolvedValue(3);
      prisma.fabric.count.mockResolvedValue(8);
      prisma.craftOption.count.mockResolvedValue(6);
      prisma.product.count.mockResolvedValue(20);
      prisma.campaignPlatform.count.mockResolvedValue(7);
      prisma.brand.findFirst.mockResolvedValue({
        officialName: 'KHADIJA-TUL-QUBRAH BY Meer&Mus',
        primaryDisplay: 'KHADIJA-TUL-QUBRAH',
        secondarySignature: 'BY Meer&Mus',
      });

      const summary = await service.getConfigSummary();

      expect(summary.catalogue.categories).toBe(5);
      expect(summary.catalogue.fabrics).toBe(8);
      expect(summary.brand.brandName).toBe('KHADIJA-TUL-QUBRAH BY Meer&Mus');
      expect(summary.brand.isConfigured).toBe(true);

    });
  });
});
