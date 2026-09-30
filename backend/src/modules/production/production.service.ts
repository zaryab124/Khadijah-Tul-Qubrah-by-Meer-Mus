import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ProductionStatus,
  OrderStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { StorageService } from '../../common/services/storage.service';
import { UpdateProductionStageDto } from './dto/update-production-stage.dto';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { CreateProductionJobDto } from './dto/create-production-job.dto';

// Strict State Transition Matrix for Atelier Garment Crafting
export const ALLOWED_PRODUCTION_TRANSITIONS: Record<ProductionStatus, ProductionStatus[]> = {
  [ProductionStatus.NEW]: [ProductionStatus.CUTTING, ProductionStatus.ON_HOLD],
  [ProductionStatus.CUTTING]: [ProductionStatus.STITCHING, ProductionStatus.ON_HOLD],
  [ProductionStatus.STITCHING]: [
    ProductionStatus.CRAFTING,
    ProductionStatus.FINISHING,
    ProductionStatus.ON_HOLD,
  ],
  [ProductionStatus.CRAFTING]: [ProductionStatus.FINISHING, ProductionStatus.ON_HOLD],
  [ProductionStatus.FINISHING]: [ProductionStatus.QUALITY_CHECK, ProductionStatus.ON_HOLD],
  [ProductionStatus.QUALITY_CHECK]: [
    ProductionStatus.READY, // If QC passed
    ProductionStatus.CUTTING, // If QC failed (rework)
    ProductionStatus.STITCHING, // If QC failed (rework)
    ProductionStatus.CRAFTING, // If QC failed (rework)
    ProductionStatus.FINISHING, // If QC failed (rework)
    ProductionStatus.ON_HOLD,
  ],
  [ProductionStatus.READY]: [ProductionStatus.COMPLETED, ProductionStatus.ON_HOLD],
  [ProductionStatus.COMPLETED]: [], // Terminal! No subsequent transitions allowed
  [ProductionStatus.ON_HOLD]: [
    ProductionStatus.CUTTING,
    ProductionStatus.STITCHING,
    ProductionStatus.CRAFTING,
    ProductionStatus.FINISHING,
    ProductionStatus.QUALITY_CHECK,
    ProductionStatus.READY,
  ],
};

const STAGE_DEFAULT_PERCENTAGES: Record<ProductionStatus, number> = {
  [ProductionStatus.NEW]: 0,
  [ProductionStatus.CUTTING]: 20,
  [ProductionStatus.STITCHING]: 40,
  [ProductionStatus.CRAFTING]: 60,
  [ProductionStatus.FINISHING]: 80,
  [ProductionStatus.QUALITY_CHECK]: 90,
  [ProductionStatus.READY]: 100,
  [ProductionStatus.COMPLETED]: 100,
  [ProductionStatus.ON_HOLD]: 0,
};

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * 1. Create a Production Job for an Order Item
   */
  async createProductionJob(user: any, dto: CreateProductionJobDto) {
    this.assertProductionOrAdmin(user);

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { orderItems: true },
    });

    if (!order) {
      throw new NotFoundException(`Order "${dto.orderId}" not found`);
    }

    const orderItem = order.orderItems.find((item) => item.id === dto.orderItemId);
    if (!orderItem) {
      throw new NotFoundException(
        `Order item "${dto.orderItemId}" not found in order "${dto.orderId}"`,
      );
    }

    const jobNumber = await this.generateJobNumber();
    const targetCompletion = dto.targetCompletionDate
      ? new Date(dto.targetCompletionDate)
      : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

    const job = await this.prisma.productionJob.create({
      data: {
        jobNumber,
        orderId: dto.orderId,
        orderItemId: dto.orderItemId,
        status: ProductionStatus.NEW,
        progressPercentage: 0,
        assignedManagerId: dto.assignedManagerId || user.id,
        targetCompletionDate: targetCompletion,
        productionNotes: dto.productionNotes || null,
      },
      include: {
        order: { select: { orderNumber: true, status: true, customerId: true } },
        orderItem: true,
      },
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'PRODUCTION_JOB_CREATED',
      entityTable: 'production_jobs',
      entityId: job.id,
      newState: { jobNumber: job.jobNumber, status: job.status },
    });

    return job;
  }

  /**
   * 2. Advance or Update Production Stage with Strict State Machine Verification
   */
  async updateProductionStage(jobId: string, user: any, dto: UpdateProductionStageDto) {
    this.assertProductionOrAdmin(user);

    const job = await this.prisma.productionJob.findUnique({
      where: { id: jobId },
      include: { order: true },
    });

    if (!job) {
      throw new NotFoundException(`Production job "${jobId}" not found`);
    }

    // INVALID TRANSITION CHECK 1: Disallow backwards jump if order is already DELIVERED
    if (job.order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException(
        `Invalid transition: Order "${job.order.orderNumber}" has already been DELIVERED. Production stages cannot be reopened (rejected transition: DELIVERED -> ${dto.stage}).`,
      );
    }

    // INVALID TRANSITION CHECK 2: Validate state machine transition rules
    this.validateStageTransition(job.status, dto.stage);

    const nextProgress =
      dto.progressPercentage !== undefined
        ? dto.progressPercentage
        : STAGE_DEFAULT_PERCENTAGES[dto.stage] || job.progressPercentage;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update Production Job
      const updatedJob = await tx.productionJob.update({
        where: { id: jobId },
        data: {
          status: dto.stage,
          progressPercentage: nextProgress,
          ...(dto.stage === ProductionStatus.COMPLETED && { actualCompletionDate: new Date() }),
        },
      });

      // 2. Log Production Update
      const updateLog = await tx.productionUpdate.create({
        data: {
          productionJobId: jobId,
          recordedBy: user.id,
          stage: dto.stage,
          progressPercentage: nextProgress,
          notes: dto.notes || null,
          photoStorageKeys: dto.photoStorageKeys || [],
        },
      });

      // 3. Keep Order status in synchronized alignment
      let targetOrderStatus: OrderStatus | null = null;
      if (dto.stage === ProductionStatus.CUTTING && job.order.status === OrderStatus.PAID) {
        targetOrderStatus = OrderStatus.IN_PRODUCTION;
      } else if (dto.stage === ProductionStatus.QUALITY_CHECK) {
        targetOrderStatus = OrderStatus.QUALITY_CHECK;
      } else if (dto.stage === ProductionStatus.READY) {
        targetOrderStatus = OrderStatus.READY_TO_SHIP;
      }

      if (targetOrderStatus) {
        await tx.order.update({
          where: { id: job.orderId },
          data: { status: targetOrderStatus },
        });
      }

      return { job: updatedJob, updateLog };
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'PRODUCTION_STAGE_UPDATED',
      entityTable: 'production_jobs',
      entityId: jobId,
      previousState: { status: job.status, progressPercentage: job.progressPercentage },
      newState: { status: dto.stage, progressPercentage: nextProgress },
    });

    return result;
  }

  /**
   * 3. Submit Quality Control Check
   * - If PASSED: Job becomes READY (100%), Order becomes READY_TO_SHIP.
   * - If FAILED: Job sent back to rework stage (e.g. STITCHING, CRAFTING) with defect issues recorded.
   */
  async submitQualityCheck(jobId: string, user: any, dto: CreateQualityCheckDto) {
    this.assertProductionOrAdmin(user);

    const job = await this.prisma.productionJob.findUnique({
      where: { id: jobId },
      include: { order: true },
    });

    if (!job) {
      throw new NotFoundException(`Production job "${jobId}" not found`);
    }

    if (
      job.status !== ProductionStatus.QUALITY_CHECK &&
      job.status !== ProductionStatus.FINISHING
    ) {
      throw new BadRequestException(
        `Quality inspection can only be performed when garment is in FINISHING or QUALITY_CHECK stage (current: ${job.status}).`,
      );
    }

    const isPassed = dto.status.toUpperCase() === 'PASSED';
    const approvedAt = isPassed ? new Date() : null;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Quality Check Record
      const qcRecord = await tx.qualityCheck.create({
        data: {
          productionJobId: jobId,
          inspectorId: user.id,
          status: isPassed ? 'PASSED' : 'FAILED',
          isPassed,
          notes: dto.notes || null,
          issues: dto.issues || [],
          measurementAccuracyVerified: dto.measurementAccuracyVerified ?? isPassed,
          fabricFinishVerified: dto.fabricFinishVerified ?? isPassed,
          embroideryAccuracyVerified: dto.embroideryAccuracyVerified ?? isPassed,
          stitchingDensityVerified: dto.stitchingDensityVerified ?? isPassed,
          defectNotes: !isPassed ? (dto.issues || []).join('; ') : null,
          inspectionPhotos: dto.inspectionPhotos || [],
          approvedAt,
        },
      });

      if (isPassed) {
        // PASSED: Advance job to READY, order to READY_TO_SHIP
        await tx.productionJob.update({
          where: { id: jobId },
          data: {
            status: ProductionStatus.READY,
            progressPercentage: 100,
          },
        });

        await tx.order.update({
          where: { id: job.orderId },
          data: {
            status: OrderStatus.READY_TO_SHIP,
          },
        });

        await tx.productionUpdate.create({
          data: {
            productionJobId: jobId,
            recordedBy: user.id,
            stage: ProductionStatus.READY,
            progressPercentage: 100,
            notes: 'Quality inspection PASSED by master artisan. Garment is packaged and ready to ship.',
          },
        });
      } else {
        // FAILED: Send back to rework stage in workshop
        const reworkStage = dto.reworkStage || ProductionStatus.STITCHING;
        const reworkProgress = STAGE_DEFAULT_PERCENTAGES[reworkStage] || 50;

        await tx.productionJob.update({
          where: { id: jobId },
          data: {
            status: reworkStage,
            progressPercentage: reworkProgress,
          },
        });

        await tx.order.update({
          where: { id: job.orderId },
          data: {
            status: OrderStatus.IN_PRODUCTION,
          },
        });

        await tx.productionUpdate.create({
          data: {
            productionJobId: jobId,
            recordedBy: user.id,
            stage: reworkStage,
            progressPercentage: reworkProgress,
            notes: `Quality inspection FAILED. Sent back to ${reworkStage} for defect remediation: ${(
              dto.issues || []
            ).join(', ')}`,
          },
        });
      }

      return qcRecord;
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'QUALITY_CHECK_COMPLETED',
      entityTable: 'quality_checks',
      entityId: result.id,
      newState: {
        status: isPassed ? 'PASSED' : 'FAILED',
        jobId,
        orderNumber: job.order.orderNumber,
      },
    });

    return result;
  }

  /**
   * 4. Operational View for Production Staff
   * Includes order, product specs, custom measurements, moodboard images with signed URLs, notes, and QC history.
   */
  async getJobOperationalDetails(jobId: string, user: any) {
    this.assertProductionOrAdmin(user);

    const job = await this.prisma.productionJob.findUnique({
      where: { id: jobId },
      include: {
        order: {
          include: {
            customer: { select: { id: true, firstName: true, lastName: true, phoneNumber: true } },
            shippingAddress: true,
          },
        },
        orderItem: {
          include: {
            customRequest: {
              include: {
                colour: true,
                fabric: true,
                standardSize: true,
                measurementTemplate: true,
                designFiles: true,
              },
            },
            productVariant: {
              include: { product: true, colour: true, size: true },
            },
          },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          include: {
            recorder: { select: { firstName: true, lastName: true, role: true } },
          },
        },
        qualityChecks: {
          orderBy: { inspectedAt: 'desc' },
          include: {
            inspector: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Production job "${jobId}" not found`);
    }

    // Enrich attached custom moodboard & sketch files with signed URLs
    let enrichedDesignFiles: any[] = [];
    if (job.orderItem?.customRequest?.designFiles) {
      enrichedDesignFiles = job.orderItem.customRequest.designFiles.map((file) => ({
        ...file,
        fileSizeBytes: file.fileSizeBytes.toString(),
        signedDownloadUrl: this.storageService.getSignedDownloadUrl(file.storageKey),
      }));
    }

    return {
      ...job,
      orderItem: {
        ...job.orderItem,
        customRequest: job.orderItem?.customRequest
          ? {
              ...job.orderItem.customRequest,
              designFiles: enrichedDesignFiles,
            }
          : null,
      },
    };
  }

  /**
   * 5. Simplified Progress Timeline for Customers
   */
  async getCustomerProgress(orderId: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        productionJobs: {
          include: {
            updates: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" not found`);
    }

    if (user.role === UserRole.CUSTOMER && order.customerId !== user.id) {
      throw new ForbiddenException(
        'Access denied: You cannot view production timeline for another customer order.',
      );
    }

    // Aggregate overall progress across jobs
    let totalProgress = 0;
    const jobs = order.productionJobs || [];
    if (jobs.length > 0) {
      const sum = jobs.reduce((acc, j) => acc + (j.progressPercentage || 0), 0);
      totalProgress = Math.round(sum / jobs.length);
    } else if (order.status === OrderStatus.PAID) {
      totalProgress = 10;
    }

    const currentStageName = jobs.length > 0 ? jobs[0].status : 'PREPARATION';

    const customerMilestones = [
      {
        step: 1,
        title: 'Order Confirmed & Atelier Queued',
        isCompleted: true,
        percentage: 10,
      },
      {
        step: 2,
        title: 'Precision Fabric Cutting & Patterning',
        isCompleted: totalProgress >= 20,
        percentage: 20,
      },
      {
        step: 3,
        title: 'Master Tailoring & Structural Stitching',
        isCompleted: totalProgress >= 40,
        percentage: 40,
      },
      {
        step: 4,
        title: 'Artisanal Hand Embellishment & Zardozi',
        isCompleted: totalProgress >= 60,
        percentage: 60,
      },
      {
        step: 5,
        title: 'Garment Finishing, Pressing & Hand Lining',
        isCompleted: totalProgress >= 80,
        percentage: 80,
      },
      {
        step: 6,
        title: 'Haute Couture Quality & Measurement Inspection',
        isCompleted: totalProgress >= 90,
        percentage: 90,
      },
      {
        step: 7,
        title: 'Ready for Luxury Insured Dispatch',
        isCompleted: totalProgress >= 100,
        percentage: 100,
      },
    ];

    return {
      orderNumber: order.orderNumber,
      overallProgressPercentage: totalProgress,
      currentStage: currentStageName,
      targetCompletionDate: jobs[0]?.targetCompletionDate || null,
      milestones: customerMilestones,
    };
  }

  /**
   * 6. Production Dashboard Overview
   */
  async getProductionDashboard(user: any) {
    this.assertProductionOrAdmin(user);

    const [
      newJobs,
      inCutting,
      inStitching,
      inCrafting,
      inFinishing,
      inQC,
      readyJobs,
      onHoldJobs,
    ] = await Promise.all([
      this.prisma.productionJob.findMany({
        where: { status: ProductionStatus.NEW },
        include: { order: { select: { orderNumber: true } }, orderItem: true },
        orderBy: { targetCompletionDate: 'asc' },
      }),
      this.prisma.productionJob.findMany({
        where: { status: ProductionStatus.CUTTING },
        include: { order: { select: { orderNumber: true } }, orderItem: true },
        orderBy: { targetCompletionDate: 'asc' },
      }),
      this.prisma.productionJob.findMany({
        where: { status: ProductionStatus.STITCHING },
        include: { order: { select: { orderNumber: true } }, orderItem: true },
        orderBy: { targetCompletionDate: 'asc' },
      }),
      this.prisma.productionJob.findMany({
        where: { status: ProductionStatus.CRAFTING },
        include: { order: { select: { orderNumber: true } }, orderItem: true },
        orderBy: { targetCompletionDate: 'asc' },
      }),
      this.prisma.productionJob.findMany({
        where: { status: ProductionStatus.FINISHING },
        include: { order: { select: { orderNumber: true } }, orderItem: true },
        orderBy: { targetCompletionDate: 'asc' },
      }),
      this.prisma.productionJob.findMany({
        where: { status: ProductionStatus.QUALITY_CHECK },
        include: { order: { select: { orderNumber: true } }, orderItem: true },
        orderBy: { targetCompletionDate: 'asc' },
      }),
      this.prisma.productionJob.findMany({
        where: { status: ProductionStatus.READY },
        include: { order: { select: { orderNumber: true } }, orderItem: true },
        orderBy: { targetCompletionDate: 'asc' },
      }),
      this.prisma.productionJob.findMany({
        where: { status: ProductionStatus.ON_HOLD },
        include: { order: { select: { orderNumber: true } }, orderItem: true },
        orderBy: { targetCompletionDate: 'asc' },
      }),
    ]);

    return {
      metrics: {
        newCount: newJobs.length,
        cuttingCount: inCutting.length,
        stitchingCount: inStitching.length,
        craftingCount: inCrafting.length,
        finishingCount: inFinishing.length,
        qcCount: inQC.length,
        readyCount: readyJobs.length,
        onHoldCount: onHoldJobs.length,
        totalActive:
          newJobs.length +
          inCutting.length +
          inStitching.length +
          inCrafting.length +
          inFinishing.length +
          inQC.length +
          readyJobs.length,
      },
      queues: {
        newJobs,
        inCutting,
        inStitching,
        inCrafting,
        inFinishing,
        inQC,
        readyJobs,
        onHoldJobs,
      },
    };
  }

  // --- VALIDATION HELPER ---

  private validateStageTransition(current: ProductionStatus, next: ProductionStatus) {
    if (current === next) {
      return; // No-op allowed
    }

    if (current === ProductionStatus.COMPLETED) {
      throw new BadRequestException(
        'Invalid transition: Job is in COMPLETED terminal state and cannot be modified.',
      );
    }

    const allowed = ALLOWED_PRODUCTION_TRANSITIONS[current] || [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid production transition from "${current}" to "${next}". Workflow sequence must be strictly followed (NEW -> CUTTING -> STITCHING -> CRAFTING -> FINISHING -> QUALITY_CHECK -> READY -> COMPLETED).`,
      );
    }
  }

  private assertProductionOrAdmin(user: any) {
    if (
      user.role !== UserRole.PRODUCTION &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Access denied: Only atelier production staff and administrators can manage production jobs.',
      );
    }
  }

  private async generateJobNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
    const count = await this.prisma.productionJob.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `JOB-${yearMonth}-${seq}`;
  }
}
