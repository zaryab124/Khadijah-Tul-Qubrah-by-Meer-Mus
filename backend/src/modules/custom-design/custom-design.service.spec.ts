import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CustomRequestStatus, UserRole, Prisma } from '@prisma/client';
const SizingMode = { STANDARD: 'STANDARD' as const, CUSTOM: 'CUSTOM' as const };
import { CustomDesignService } from './custom-design.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { AuditService } from '../../common/services/audit.service';

describe('CustomDesignService (Phase 4 — Custom Design Studio)', () => {
  let service: CustomDesignService;
  let prismaService: any;
  let storageService: any;
  let auditService: any;

  const mockCustomer = {
    id: 'cust-1',
    role: UserRole.CUSTOMER,
    email: 'customer1@example.com',
  };

  const mockOtherCustomer = {
    id: 'cust-2',
    role: UserRole.CUSTOMER,
    email: 'intruder@example.com',
  };

  const mockDesigner = {
    id: 'des-1',
    role: UserRole.DESIGNER,
    email: 'designer@meermus.luxury',
  };

  const mockAdmin = {
    id: 'admin-1',
    role: UserRole.ADMIN,
    email: 'admin@meermus.luxury',
  };

  beforeEach(async () => {
    prismaService = {
      customDesignRequest: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      designFile: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      measurementTemplate: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    storageService = {
      validateFile: jest.fn(),
      generateStorageKeys: jest.fn().mockReturnValue({
        storageKey: 'custom-requests/req-1/inspiration.jpg',
        thumbnailKey: 'custom-requests/req-1/thumbnails/inspiration_thumb.jpg',
      }),
      getPresignedUploadUrl: jest.fn().mockReturnValue({
        uploadUrl: 'https://s3.meermus.luxury/upload?sig=abc',
        expiresInSeconds: 900,
      }),
      getSignedDownloadUrl: jest.fn().mockImplementation((key) => `https://s3.meermus.luxury/download/${key}?sig=xyz`),
      getSignedThumbnailUrl: jest.fn().mockImplementation((key) => `https://s3.meermus.luxury/thumb/${key}?sig=xyz`),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomDesignService,
        { provide: PrismaService, useValue: prismaService },
        { provide: StorageService, useValue: storageService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CustomDesignService>(CustomDesignService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. Customer creates custom design request (Draft)', () => {
    it('should create request with custom measurements and audit log', async () => {
      prismaService.customDesignRequest.count.mockResolvedValue(0);
      prismaService.customDesignRequest.create.mockResolvedValue({
        id: 'req-1',
        requestNumber: 'CDR-202609-0001',
        customerId: mockCustomer.id,
        sizingMode: SizingMode.CUSTOM,
        customMeasurements: { chest: 38, waist: 32, hip: 40, length: 54 },
        status: CustomRequestStatus.DRAFT,
      });

      const result = await service.createRequest(mockCustomer.id, {
        sizingMode: SizingMode.CUSTOM,
        customMeasurements: { chest: 38, waist: 32, hip: 40, length: 54 },
        designNotes: 'Hand-embroidered zardozi border with emerald green velvet base',
        customerBudget: 150000,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('req-1');
      expect(result.status).toBe(CustomRequestStatus.DRAFT);
      expect(prismaService.customDesignRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: mockCustomer.id,
            sizingMode: SizingMode.CUSTOM,
            status: CustomRequestStatus.DRAFT,
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockCustomer.id,
          action: 'CUSTOM_REQUEST_CREATED',
        }),
      );
    });

    it('should reject request if sizingMode is CUSTOM but no measurements provided', async () => {
      await expect(
        service.createRequest(mockCustomer.id, {
          sizingMode: SizingMode.CUSTOM,
          customMeasurements: undefined,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Upload inspiration image with S3 pre-signed URL & DB metadata', () => {
    it('should validate file, record in design_files, and return presigned upload + signed download URLs', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        customerId: mockCustomer.id,
        status: CustomRequestStatus.DRAFT,
      });

      prismaService.designFile.create.mockResolvedValue({
        id: 'file-1',
        customRequestId: 'req-1',
        uploadedBy: mockCustomer.id,
        fileType: 'INSPIRATION',
        fileName: 'inspiration-moodboard.jpg',
        storageKey: 'custom-requests/req-1/inspiration.jpg',
        thumbnailKey: 'custom-requests/req-1/thumbnails/inspiration_thumb.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: BigInt(2048000),
      });

      const response = await service.uploadFile('req-1', mockCustomer, {
        fileType: 'INSPIRATION',
        fileName: 'inspiration-moodboard.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 2048000,
      });

      expect(storageService.validateFile).toHaveBeenCalledWith('image/jpeg', 2048000);
      expect(prismaService.designFile.create).toHaveBeenCalled();
      expect(response.uploadUrl).toBe('https://s3.meermus.luxury/upload?sig=abc');
      expect(response.file.signedDownloadUrl).toContain('custom-requests/req-1/inspiration.jpg');
      expect(response.file.fileSizeBytes).toBe('2048000');
    });
  });

  describe('3. Customer Isolation & Access Security', () => {
    it('should block unauthorized customer from viewing another customer request', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        customerId: mockCustomer.id, // belongs to cust-1
        status: CustomRequestStatus.DRAFT,
        designFiles: [],
        quotations: [],
      });

      // cust-2 attempts to access cust-1's request
      await expect(service.getRequestById('req-1', mockOtherCustomer)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should block unauthorized customer from uploading files to another customer request', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        customerId: mockCustomer.id,
        status: CustomRequestStatus.DRAFT,
      });

      await expect(
        service.uploadFile('req-1', mockOtherCustomer, {
          fileType: 'INSPIRATION',
          fileName: 'intruder.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 500000,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4. Submit request and advance status to SUBMITTED', () => {
    it('should submit request, update status to SUBMITTED and log audit event', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        customerId: mockCustomer.id,
        status: CustomRequestStatus.DRAFT,
      });

      prismaService.customDesignRequest.update.mockResolvedValue({
        id: 'req-1',
        status: CustomRequestStatus.SUBMITTED,
      });

      const submitted = await service.submitRequest('req-1', mockCustomer);

      expect(submitted.status).toBe(CustomRequestStatus.SUBMITTED);
      expect(prismaService.customDesignRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { status: CustomRequestStatus.SUBMITTED },
        include: expect.any(Object),
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockCustomer.id,
          action: 'CUSTOM_REQUEST_SUBMITTED',
          previousState: { status: CustomRequestStatus.DRAFT },
          newState: { status: CustomRequestStatus.SUBMITTED },
        }),
      );
    });

    it('should reject submission if request is already SUBMITTED', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        customerId: mockCustomer.id,
        status: CustomRequestStatus.SUBMITTED,
      });

      await expect(service.submitRequest('req-1', mockCustomer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('5. Designer and Admin Visibility', () => {
    it('should allow Designer to list submitted requests for design pickup', async () => {
      prismaService.customDesignRequest.findMany.mockResolvedValue([
        {
          id: 'req-1',
          status: CustomRequestStatus.SUBMITTED,
          customerId: mockCustomer.id,
        },
      ]);

      const requests = await service.listRequests(mockDesigner);

      expect(requests.length).toBe(1);
      expect(prismaService.customDesignRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { assignedDesignerId: mockDesigner.id },
              { status: CustomRequestStatus.SUBMITTED },
            ],
          },
        }),
      );
    });

    it('should allow Admin full visibility over all requests', async () => {
      prismaService.customDesignRequest.findMany.mockResolvedValue([
        { id: 'req-1', status: CustomRequestStatus.SUBMITTED },
        { id: 'req-2', status: CustomRequestStatus.DRAFT },
      ]);

      const requests = await service.listRequests(mockAdmin);

      expect(requests.length).toBe(2);
      expect(prismaService.customDesignRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}, // Admin has no restrictive filters
        }),
      );
    });
  });

  describe('6. Customer Modification Lock on Submitted Requests', () => {
    it('should throw BadRequestException when customer attempts to edit a SUBMITTED request', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        customerId: mockCustomer.id,
        status: CustomRequestStatus.SUBMITTED, // Already submitted!
      });

      await expect(
        service.updateRequest('req-1', mockCustomer, {
          designNotes: 'Attempting to change design details after submission',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow customer to edit request when in REVISION_REQUESTED status', async () => {
      prismaService.customDesignRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        customerId: mockCustomer.id,
        status: CustomRequestStatus.REVISION_REQUESTED,
      });

      prismaService.customDesignRequest.update.mockResolvedValue({
        id: 'req-1',
        status: CustomRequestStatus.REVISION_REQUESTED,
        designNotes: 'Updated neckline to boat neck per quotation discussion',
      });

      const updated = await service.updateRequest('req-1', mockCustomer, {
        designNotes: 'Updated neckline to boat neck per quotation discussion',
      });

      expect(updated.designNotes).toBe('Updated neckline to boat neck per quotation discussion');
      expect(prismaService.customDesignRequest.update).toHaveBeenCalled();
    });
  });

  describe('7. Configurable Measurement Templates', () => {
    it('should list active measurement templates', async () => {
      prismaService.measurementTemplate.findMany.mockResolvedValue([
        {
          id: 'mt-1',
          title: 'Bridal Lehenga Standard Template',
          garmentType: 'LEHENGA',
          unit: 'INCHES',
          fields: [
            { key: 'blouseLength', label: 'Blouse Length', required: true },
            { key: 'chest', label: 'Chest / Bust', required: true },
            { key: 'skirtLength', label: 'Lehenga Skirt Length', required: true },
          ],
          isActive: true,
        },
      ]);

      const templates = await service.listMeasurementTemplates();
      expect(templates.length).toBe(1);
      expect(templates[0].title).toBe('Bridal Lehenga Standard Template');
    });

    it('should create a new measurement template', async () => {
      prismaService.measurementTemplate.create.mockResolvedValue({
        id: 'mt-2',
        title: 'Sherwani Bespoke Template',
        garmentType: 'SHERWANI',
        unit: 'INCHES',
        fields: [{ key: 'crossShoulder', label: 'Cross Shoulder', required: true }],
        isActive: true,
      });

      const created = await service.createMeasurementTemplate({
        title: 'Sherwani Bespoke Template',
        garmentType: 'SHERWANI',
        unit: 'INCHES',
        fields: [{ key: 'crossShoulder', label: 'Cross Shoulder', required: true }],
      });

      expect(created.title).toBe('Sherwani Bespoke Template');
      expect(prismaService.measurementTemplate.create).toHaveBeenCalled();
    });
  });
});
