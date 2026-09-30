import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CustomRequestStatus, UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateCustomRequestDto } from './dto/create-custom-request.dto';
import { UpdateCustomRequestDto } from './dto/update-custom-request.dto';
import { UploadDesignFileDto } from './dto/upload-design-file.dto';
import { CreateMeasurementTemplateDto } from './dto/create-measurement-template.dto';

@Injectable()
export class CustomDesignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
  ) {}

  async createRequest(customerId: string, dto: CreateCustomRequestDto) {
    if (dto.sizingMode === 'CUSTOM' && !dto.customMeasurements) {
      throw new BadRequestException(
        'Custom measurements payload is required when sizingMode is set to "CUSTOM".',
      );
    }

    const requestNumber = await this.generateRequestNumber();

    const request = await this.prisma.customDesignRequest.create({
      data: {
        requestNumber,
        customerId,
        referencedProductId: dto.referencedProductId || null,
        colourPreference: dto.colourPreference || null,
        colourId: dto.colourId || null,
        fabricId: dto.fabricId || null,
        craftOptionIds: dto.craftOptionIds || [],
        sizingMode: dto.sizingMode,
        standardSizeId: dto.standardSizeId || null,
        measurementTemplateId: dto.measurementTemplateId || null,
        customMeasurements: dto.customMeasurements || undefined,
        designNotes: dto.designNotes || null,
        customerBudget: dto.customerBudget ? new Prisma.Decimal(dto.customerBudget) : null,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
        status: CustomRequestStatus.DRAFT,
      },
      include: {
        referencedProduct: { select: { id: true, name: true, slug: true, basePrice: true } },
        colour: true,
        fabric: true,
        standardSize: true,
        measurementTemplate: true,
      },
    });

    await this.auditService.logAction({
      actorId: customerId,
      action: 'CUSTOM_REQUEST_CREATED',
      entityTable: 'custom_design_requests',
      entityId: request.id,
      newState: { requestNumber: request.requestNumber, status: request.status },
    });

    return request;
  }

  async uploadFile(requestId: string, user: any, dto: UploadDesignFileDto) {
    const request = await this.findRequestEntity(requestId);
    this.assertRequestAccess(request, user);

    this.storageService.validateFile(dto.mimeType, dto.fileSizeBytes);

    const folder = `custom-requests/${request.id}`;
    const keys = this.storageService.generateStorageKeys(folder, dto.fileName);
    const storageKey = dto.storageKey || keys.storageKey;
    const thumbnailKey = dto.thumbnailKey || keys.thumbnailKey;

    const file = await this.prisma.designFile.create({
      data: {
        customRequestId: request.id,
        uploadedBy: user.id,
        fileType: dto.fileType,
        fileName: dto.fileName,
        storageKey,
        thumbnailKey,
        mimeType: dto.mimeType,
        fileSizeBytes: BigInt(dto.fileSizeBytes),
      },
    });

    const presigned = this.storageService.getPresignedUploadUrl(
      folder,
      dto.fileName,
      dto.mimeType,
      dto.fileSizeBytes,
    );

    return {
      file: {
        ...file,
        fileSizeBytes: file.fileSizeBytes.toString(),
        signedDownloadUrl: this.storageService.getSignedDownloadUrl(storageKey),
        signedThumbnailUrl: this.storageService.getSignedThumbnailUrl(thumbnailKey),
      },
      uploadUrl: presigned.uploadUrl,
      expiresInSeconds: presigned.expiresInSeconds,
    };
  }

  async getFiles(requestId: string, user: any) {
    const request = await this.findRequestEntity(requestId);
    this.assertRequestAccess(request, user);

    const files = await this.prisma.designFile.findMany({
      where: { customRequestId: requestId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    return files.map((f) => ({
      ...f,
      fileSizeBytes: f.fileSizeBytes.toString(),
      signedDownloadUrl: this.storageService.getSignedDownloadUrl(f.storageKey),
      signedThumbnailUrl: f.thumbnailKey
        ? this.storageService.getSignedThumbnailUrl(f.thumbnailKey)
        : null,
    }));
  }

  async getRequestById(requestId: string, user: any) {
    const request = await this.prisma.customDesignRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        referencedProduct: true,
        colour: true,
        fabric: true,
        standardSize: true,
        measurementTemplate: true,
        designFiles: {
          orderBy: { createdAt: 'desc' },
        },
        quotations: {
          orderBy: { versionNumber: 'desc' },
          include: {
            items: true,
          },
        },
        assignedAgent: { select: { id: true, firstName: true, lastName: true } },
        assignedDesigner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!request) {
      throw new NotFoundException(`Custom design request "${requestId}" not found`);
    }

    this.assertRequestAccess(request, user);

    // Attach short-lived signed URLs for protected customer files
    const enrichedFiles = request.designFiles.map((f) => ({
      ...f,
      fileSizeBytes: f.fileSizeBytes.toString(),
      signedDownloadUrl: this.storageService.getSignedDownloadUrl(f.storageKey),
      signedThumbnailUrl: f.thumbnailKey
        ? this.storageService.getSignedThumbnailUrl(f.thumbnailKey)
        : null,
    }));

    return {
      ...request,
      designFiles: enrichedFiles,
    };
  }

  async updateRequest(requestId: string, user: any, dto: UpdateCustomRequestDto) {
    const request = await this.findRequestEntity(requestId);
    this.assertRequestAccess(request, user);

    // Strict state check: submitted requests are locked for customer edits
    if (
      user.role === UserRole.CUSTOMER &&
      request.status !== CustomRequestStatus.DRAFT &&
      request.status !== CustomRequestStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        `Cannot modify custom request in status "${request.status}". Once submitted, edits must be requested through revisions.`,
      );
    }

    return this.prisma.customDesignRequest.update({
      where: { id: requestId },
      data: {
        ...(dto.referencedProductId !== undefined && {
          referencedProductId: dto.referencedProductId,
        }),
        ...(dto.colourPreference !== undefined && { colourPreference: dto.colourPreference }),
        ...(dto.colourId !== undefined && { colourId: dto.colourId }),
        ...(dto.fabricId !== undefined && { fabricId: dto.fabricId }),
        ...(dto.craftOptionIds !== undefined && { craftOptionIds: dto.craftOptionIds }),
        ...(dto.sizingMode !== undefined && { sizingMode: dto.sizingMode }),
        ...(dto.standardSizeId !== undefined && { standardSizeId: dto.standardSizeId }),
        ...(dto.measurementTemplateId !== undefined && {
          measurementTemplateId: dto.measurementTemplateId,
        }),
        ...(dto.customMeasurements !== undefined && {
          customMeasurements: dto.customMeasurements,
        }),
        ...(dto.designNotes !== undefined && { designNotes: dto.designNotes }),
        ...(dto.customerBudget !== undefined && {
          customerBudget: new Prisma.Decimal(dto.customerBudget),
        }),
        ...(dto.expectedDeliveryDate !== undefined && {
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
        }),
      },
      include: {
        referencedProduct: true,
        colour: true,
        fabric: true,
        standardSize: true,
      },
    });
  }

  async submitRequest(requestId: string, user: any) {
    const request = await this.findRequestEntity(requestId);
    this.assertRequestAccess(request, user);

    if (
      request.status !== CustomRequestStatus.DRAFT &&
      request.status !== CustomRequestStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        `Request is already submitted or in review (current status: ${request.status}).`,
      );
    }

    const updated = await this.prisma.customDesignRequest.update({
      where: { id: requestId },
      data: {
        status: CustomRequestStatus.SUBMITTED,
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        designFiles: true,
        fabric: true,
        colour: true,
      },
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'CUSTOM_REQUEST_SUBMITTED',
      entityTable: 'custom_design_requests',
      entityId: request.id,
      previousState: { status: request.status },
      newState: { status: CustomRequestStatus.SUBMITTED },
    });

    return updated;
  }

  async listRequests(user: any, status?: CustomRequestStatus) {
    const where: Prisma.CustomDesignRequestWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (user.role === UserRole.CUSTOMER) {
      where.customerId = user.id;
    } else if (user.role === UserRole.AGENT) {
      where.assignedAgentId = user.id;
    } else if (user.role === UserRole.DESIGNER) {
      where.OR = [
        { assignedDesignerId: user.id },
        { status: CustomRequestStatus.SUBMITTED }, // Unassigned requests for design pickup
      ];
    }
    // SUPER_ADMIN and ADMIN see all requests

    return this.prisma.customDesignRequest.findMany({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        referencedProduct: { select: { id: true, name: true, slug: true } },
        colour: true,
        fabric: true,
        quotations: {
          select: { id: true, versionNumber: true, status: true, totalAmount: true },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Measurement Templates
  async listMeasurementTemplates() {
    return this.prisma.measurementTemplate.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });
  }

  async createMeasurementTemplate(dto: CreateMeasurementTemplateDto) {
    return this.prisma.measurementTemplate.create({
      data: {
        title: dto.title,
        garmentType: dto.garmentType,
        description: dto.description || null,
        unit: dto.unit || 'INCHES',
        fields: dto.fields,
        isActive: true,
      },
    });
  }

  private async findRequestEntity(id: string) {
    const request = await this.prisma.customDesignRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Custom design request with ID "${id}" not found`);
    }
    return request;
  }

  private assertRequestAccess(request: any, user: any) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return; // Full access
    }

    if (user.role === UserRole.CUSTOMER) {
      if (request.customerId !== user.id) {
        throw new ForbiddenException(
          'Access denied: You do not have permission to view or modify another customer custom request.',
        );
      }
      return;
    }

    if (user.role === UserRole.AGENT) {
      if (request.assignedAgentId && request.assignedAgentId !== user.id) {
        throw new ForbiddenException(
          'Access denied: You are not the assigned sales agent for this custom request.',
        );
      }
      return;
    }

    if (user.role === UserRole.DESIGNER) {
      if (
        request.assignedDesignerId &&
        request.assignedDesignerId !== user.id &&
        request.status !== CustomRequestStatus.SUBMITTED
      ) {
        throw new ForbiddenException(
          'Access denied: You are not the assigned designer for this custom request.',
        );
      }
      return;
    }

    throw new ForbiddenException('Access denied for current user role.');
  }

  private async generateRequestNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
    const count = await this.prisma.customDesignRequest.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `CDR-${yearMonth}-${seq}`;
  }
}
