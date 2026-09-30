import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  ProductionStatus,
  OrderStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import { ProductionService } from './production.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { StorageService } from '../../common/services/storage.service';

describe('ProductionService (Phase 7 — Production Management & QC)', () => {
  let service: ProductionService;
  let prismaService: any;
  let auditService: any;
  let storageService: any;

  const mockProductionStaff = {
    id: 'prod-staff-1',
    role: UserRole.PRODUCTION,
    email: 'atelier@meermus.luxury',
  };

  const mockCustomer = {
    id: 'cust-1',
    role: UserRole.CUSTOMER,
    email: 'client@example.com',
  };

  const mockOtherCustomer = {
    id: 'cust-2',
    role: UserRole.CUSTOMER,
    email: 'intruder@example.com',
  };

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-202609-0001',
    customerId: mockCustomer.id,
    status: OrderStatus.PAID,
    orderItems: [
      { id: 'item-1', itemTitle: 'Emerald Velvet Peshwas' },
    ],
  };

  beforeEach(async () => {
    prismaService = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      productionJob: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      productionUpdate: {
        create: jest.fn(),
      },
      qualityCheck: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaService)),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({}),
    };

    storageService = {
      getSignedDownloadUrl: jest.fn().mockImplementation((key) => `https://s3.meermus.luxury/${key}?signed=true`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. Create Production Job', () => {
    it('should create production job for paid order item in NEW status (0% progress)', async () => {
      prismaService.order.findUnique.mockResolvedValue(mockOrder);
      prismaService.productionJob.count.mockResolvedValue(0);

      const mockJob = {
        id: 'job-1',
        jobNumber: 'JOB-202609-0001',
        orderId: 'order-1',
        orderItemId: 'item-1',
        status: ProductionStatus.NEW,
        progressPercentage: 0,
      };

      prismaService.productionJob.create.mockResolvedValue(mockJob);

      const job = await service.createProductionJob(mockProductionStaff, {
        orderId: 'order-1',
        orderItemId: 'item-1',
        productionNotes: 'Priority bridal order with pure micro velvet 9000',
      });

      expect(job).toBeDefined();
      expect(job.jobNumber).toBe('JOB-202609-0001');
      expect(job.status).toBe(ProductionStatus.NEW);
      expect(job.progressPercentage).toBe(0);
      expect(prismaService.productionJob.create).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PRODUCTION_JOB_CREATED',
          actorId: mockProductionStaff.id,
        }),
      );
    });
  });

  describe('2. Sequential Valid State Transitions', () => {
    it('NEW -> CUTTING (20%): advances order status to IN_PRODUCTION', async () => {
      const mockJob = {
        id: 'job-1',
        status: ProductionStatus.NEW,
        progressPercentage: 0,
        orderId: 'order-1',
        order: { id: 'order-1', orderNumber: 'ORD-1', status: OrderStatus.PAID },
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);
      prismaService.productionJob.update.mockResolvedValue({
        ...mockJob,
        status: ProductionStatus.CUTTING,
        progressPercentage: 20,
      });

      const result = await service.updateProductionStage('job-1', mockProductionStaff, {
        stage: ProductionStatus.CUTTING,
        notes: 'Fabric inspected and pattern pieces cut.',
      });

      expect(result.job.status).toBe(ProductionStatus.CUTTING);
      expect(result.job.progressPercentage).toBe(20);
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: OrderStatus.IN_PRODUCTION },
      });
      expect(prismaService.productionUpdate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stage: ProductionStatus.CUTTING,
            progressPercentage: 20,
          }),
        }),
      );
    });

    it('CUTTING -> STITCHING (40%): advances to master tailoring', async () => {
      const mockJob = {
        id: 'job-1',
        status: ProductionStatus.CUTTING,
        progressPercentage: 20,
        orderId: 'order-1',
        order: { id: 'order-1', status: OrderStatus.IN_PRODUCTION },
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);
      prismaService.productionJob.update.mockResolvedValue({
        ...mockJob,
        status: ProductionStatus.STITCHING,
        progressPercentage: 40,
      });

      const result = await service.updateProductionStage('job-1', mockProductionStaff, {
        stage: ProductionStatus.STITCHING,
      });

      expect(result.job.status).toBe(ProductionStatus.STITCHING);
      expect(result.job.progressPercentage).toBe(40);
    });

    it('STITCHING -> CRAFTING (60%): advances to hand embroidery & embellishment', async () => {
      const mockJob = {
        id: 'job-1',
        status: ProductionStatus.STITCHING,
        progressPercentage: 40,
        orderId: 'order-1',
        order: { id: 'order-1', status: OrderStatus.IN_PRODUCTION },
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);
      prismaService.productionJob.update.mockResolvedValue({
        ...mockJob,
        status: ProductionStatus.CRAFTING,
        progressPercentage: 60,
      });

      const result = await service.updateProductionStage('job-1', mockProductionStaff, {
        stage: ProductionStatus.CRAFTING,
      });

      expect(result.job.status).toBe(ProductionStatus.CRAFTING);
      expect(result.job.progressPercentage).toBe(60);
    });

    it('CRAFTING -> FINISHING (80%): advances to pressing and lining', async () => {
      const mockJob = {
        id: 'job-1',
        status: ProductionStatus.CRAFTING,
        progressPercentage: 60,
        orderId: 'order-1',
        order: { id: 'order-1', status: OrderStatus.IN_PRODUCTION },
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);
      prismaService.productionJob.update.mockResolvedValue({
        ...mockJob,
        status: ProductionStatus.FINISHING,
        progressPercentage: 80,
      });

      const result = await service.updateProductionStage('job-1', mockProductionStaff, {
        stage: ProductionStatus.FINISHING,
      });

      expect(result.job.status).toBe(ProductionStatus.FINISHING);
      expect(result.job.progressPercentage).toBe(80);
    });

    it('FINISHING -> QUALITY_CHECK (90%): advances order to QUALITY_CHECK', async () => {
      const mockJob = {
        id: 'job-1',
        status: ProductionStatus.FINISHING,
        progressPercentage: 80,
        orderId: 'order-1',
        order: { id: 'order-1', status: OrderStatus.IN_PRODUCTION },
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);
      prismaService.productionJob.update.mockResolvedValue({
        ...mockJob,
        status: ProductionStatus.QUALITY_CHECK,
        progressPercentage: 90,
      });

      const result = await service.updateProductionStage('job-1', mockProductionStaff, {
        stage: ProductionStatus.QUALITY_CHECK,
      });

      expect(result.job.status).toBe(ProductionStatus.QUALITY_CHECK);
      expect(result.job.progressPercentage).toBe(90);
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: OrderStatus.QUALITY_CHECK },
      });
    });
  });

  describe('3. Strict Invalid State Transition Rejections', () => {
    it('should reject invalid transition DELIVERED -> CUTTING', async () => {
      const mockJob = {
        id: 'job-1',
        status: ProductionStatus.COMPLETED,
        progressPercentage: 100,
        order: { orderNumber: 'ORD-1', status: OrderStatus.DELIVERED }, // Order is DELIVERED!
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        service.updateProductionStage('job-1', mockProductionStaff, {
          stage: ProductionStatus.CUTTING,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid transition NEW -> COMPLETED directly', async () => {
      const mockJob = {
        id: 'job-1',
        status: ProductionStatus.NEW,
        progressPercentage: 0,
        order: { orderNumber: 'ORD-1', status: OrderStatus.PAID },
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        service.updateProductionStage('job-1', mockProductionStaff, {
          stage: ProductionStatus.COMPLETED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject transition once job is in terminal COMPLETED state', async () => {
      const mockJob = {
        id: 'job-1',
        status: ProductionStatus.COMPLETED,
        progressPercentage: 100,
        order: { orderNumber: 'ORD-1', status: OrderStatus.SHIPPED },
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        service.updateProductionStage('job-1', mockProductionStaff, {
          stage: ProductionStatus.STITCHING,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Pause and Resume via ON_HOLD', () => {
    it('should allow pausing to ON_HOLD and resuming back to active stage', async () => {
      const mockJob = {
        id: 'job-1',
        status: ProductionStatus.STITCHING,
        progressPercentage: 40,
        order: { status: OrderStatus.IN_PRODUCTION },
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);
      prismaService.productionJob.update.mockResolvedValue({
        ...mockJob,
        status: ProductionStatus.ON_HOLD,
      });

      // Pause to ON_HOLD
      const paused = await service.updateProductionStage('job-1', mockProductionStaff, {
        stage: ProductionStatus.ON_HOLD,
        notes: 'Awaiting client confirmation on neck depth modification',
      });
      expect(paused.job.status).toBe(ProductionStatus.ON_HOLD);

      // Resume back to STITCHING
      prismaService.productionJob.findUnique.mockResolvedValue({
        ...mockJob,
        status: ProductionStatus.ON_HOLD,
      });
      prismaService.productionJob.update.mockResolvedValue({
        ...mockJob,
        status: ProductionStatus.STITCHING,
        progressPercentage: 40,
      });

      const resumed = await service.updateProductionStage('job-1', mockProductionStaff, {
        stage: ProductionStatus.STITCHING,
        notes: 'Client confirmed. Resumed stitching.',
      });
      expect(resumed.job.status).toBe(ProductionStatus.STITCHING);
    });
  });

  describe('5. Quality Control Check — PASSED', () => {
    it('should pass QC, advance job to READY (100%), and order to READY_TO_SHIP', async () => {
      const mockJob = {
        id: 'job-1',
        orderId: 'order-1',
        status: ProductionStatus.QUALITY_CHECK,
        order: { orderNumber: 'ORD-1', status: OrderStatus.QUALITY_CHECK },
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);
      prismaService.qualityCheck.create.mockResolvedValue({
        id: 'qc-1',
        productionJobId: 'job-1',
        status: 'PASSED',
        isPassed: true,
        approvedAt: new Date(),
      });

      const qc = await service.submitQualityCheck('job-1', mockProductionStaff, {
        status: 'PASSED',
        notes: 'Perfect stitch density and embroidery aligns exactly with blueprint.',
      });

      expect(qc.isPassed).toBe(true);
      expect(qc.approvedAt).toBeDefined();

      expect(prismaService.productionJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          status: ProductionStatus.READY,
          progressPercentage: 100,
        },
      });

      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: OrderStatus.READY_TO_SHIP,
        },
      });

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'QUALITY_CHECK_COMPLETED',
          newState: expect.objectContaining({ status: 'PASSED' }),
        }),
      );
    });
  });

  describe('6. Quality Control Check — FAILED (Rework Loop)', () => {
    it('should fail QC, record defect issues, send job back to STITCHING, and keep order in IN_PRODUCTION', async () => {
      const mockJob = {
        id: 'job-1',
        orderId: 'order-1',
        status: ProductionStatus.QUALITY_CHECK,
        order: { orderNumber: 'ORD-1', status: OrderStatus.QUALITY_CHECK },
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJob);
      prismaService.qualityCheck.create.mockResolvedValue({
        id: 'qc-2',
        productionJobId: 'job-1',
        status: 'FAILED',
        isPassed: false,
        issues: ['Sleeve length 0.5 inches longer than custom spec'],
        approvedAt: null,
      });

      const qc = await service.submitQualityCheck('job-1', mockProductionStaff, {
        status: 'FAILED',
        reworkStage: ProductionStatus.STITCHING,
        issues: ['Sleeve length 0.5 inches longer than custom spec'],
        notes: 'Rework hem and adjust sleeve length before reinspection.',
      });

      expect(qc.isPassed).toBe(false);
      expect(qc.approvedAt).toBeNull();

      // Sent back to STITCHING (40% progress)
      expect(prismaService.productionJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: {
          status: ProductionStatus.STITCHING,
          progressPercentage: 40,
        },
      });

      // Order status set back to IN_PRODUCTION
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: OrderStatus.IN_PRODUCTION,
        },
      });
    });
  });

  describe('7. Operational View vs Customer Simplified Progress Timeline', () => {
    it('Operational view should include custom specs, signed URLs, and update history for staff', async () => {
      const mockJobWithSpecs = {
        id: 'job-1',
        jobNumber: 'JOB-1',
        status: ProductionStatus.CRAFTING,
        order: {
          orderNumber: 'ORD-1',
          customer: { firstName: 'Sarah', lastName: 'Khan', phoneNumber: '+923001234567' },
        },
        orderItem: {
          customRequest: {
            colour: { name: 'Emerald' },
            fabric: { name: 'Pure Katan Silk' },
            designFiles: [
              {
                id: 'file-1',
                storageKey: 'custom-requests/req-1/inspiration.jpg',
                fileSizeBytes: BigInt(2048000),
              },
            ],
          },
        },
        updates: [],
        qualityChecks: [],
      };

      prismaService.productionJob.findUnique.mockResolvedValue(mockJobWithSpecs);

      const staffView = await service.getJobOperationalDetails('job-1', mockProductionStaff);

      expect(staffView).toBeDefined();
      expect(staffView.orderItem.customRequest.designFiles[0].signedDownloadUrl).toContain(
        'custom-requests/req-1/inspiration.jpg',
      );
    });

    it('Customer progress view should return clean simplified percentage and milestones', async () => {
      const mockCustomerOrder = {
        id: 'order-1',
        orderNumber: 'ORD-1',
        customerId: mockCustomer.id,
        status: OrderStatus.IN_PRODUCTION,
        productionJobs: [
          { status: ProductionStatus.CRAFTING, progressPercentage: 60, targetCompletionDate: new Date() },
        ],
      };

      prismaService.order.findUnique.mockResolvedValue(mockCustomerOrder);

      const customerProgress = await service.getCustomerProgress('order-1', mockCustomer);

      expect(customerProgress.orderNumber).toBe('ORD-1');
      expect(customerProgress.overallProgressPercentage).toBe(60);
      expect(customerProgress.currentStage).toBe('CRAFTING');
      expect(customerProgress.milestones.length).toBe(7);
      expect(customerProgress.milestones.find((m) => m.step === 4)?.isCompleted).toBe(true);
      expect(customerProgress.milestones.find((m) => m.step === 6)?.isCompleted).toBe(false);
    });

    it('Unauthorized customer cannot view progress of another customer order', async () => {
      const mockCustomerOrder = {
        id: 'order-1',
        customerId: mockCustomer.id, // belongs to cust-1
      };

      prismaService.order.findUnique.mockResolvedValue(mockCustomerOrder);

      await expect(
        service.getCustomerProgress('order-1', mockOtherCustomer),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
