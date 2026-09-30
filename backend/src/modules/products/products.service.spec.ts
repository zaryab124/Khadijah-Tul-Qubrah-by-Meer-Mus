import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProductsService (Phase 3 — Brand and Product Catalogue)', () => {
  let service: ProductsService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      productImage: {
        create: jest.fn(),
        createMany: jest.fn(),
        delete: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. Create Product through Admin', () => {
    it('should create product with variants and images', async () => {
      prismaService.product.findUnique
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(null) // sku check
        .mockResolvedValueOnce({
          id: 'prod-1',
          name: 'Shahzadi Emerald Velvet Peshwas',
          slug: 'shahzadi-emerald-velvet-peshwas',
          sku: 'KTQ-BRD-001',
          basePrice: new Prisma.Decimal(185000),
          isCustomizable: true,
          isActive: true,
          images: [{ id: 'img-1', imageUrl: '/assets/products/peshwas-front.jpg' }],
          variants: [{ id: 'var-1', sku: 'KTQ-BRD-001-M', stockQuantity: 5 }],
        });

      prismaService.product.create.mockResolvedValue({
        id: 'prod-1',
        name: 'Shahzadi Emerald Velvet Peshwas',
        slug: 'shahzadi-emerald-velvet-peshwas',
        sku: 'KTQ-BRD-001',
      });

      const result = await service.create({
        name: 'Shahzadi Emerald Velvet Peshwas',
        basePrice: 185000,
        isCustomizable: true,
        variants: [{ sku: 'KTQ-BRD-001-M', stockQuantity: 5 }],
        images: [
          {
            storageKey: 'products/peshwas-front.jpg',
            imageUrl: '/assets/products/peshwas-front.jpg',
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.name).toEqual('Shahzadi Emerald Velvet Peshwas');
      expect(result.basePrice).toEqual(new Prisma.Decimal(185000));
      expect(prismaService.product.create).toHaveBeenCalled();
      expect(prismaService.productVariant.createMany).toHaveBeenCalled();
      expect(prismaService.productImage.createMany).toHaveBeenCalled();
    });
  });

  describe('2. Verify it appears in customer catalogue', () => {
    it('should list only active products for public customer browsing', async () => {
      const mockActiveProducts = [
        {
          id: 'prod-1',
          name: 'Shahzadi Emerald Velvet Peshwas',
          basePrice: new Prisma.Decimal(185000),
          isActive: true,
          category: { name: 'Haute Couture Bridal' },
          images: [],
          variants: [],
        },
      ];

      prismaService.product.count.mockResolvedValue(1);
      prismaService.product.findMany.mockResolvedValue(mockActiveProducts);

      const result = await service.findAll({}, false); // false = customer mode

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('prod-1');
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('3 & 4. Change price and verify customer receives updated price', () => {
    it('should update price and reflect new price to customer', async () => {
      prismaService.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        slug: 'shahzadi-emerald-velvet-peshwas',
        basePrice: new Prisma.Decimal(185000),
        isActive: true,
      });

      prismaService.product.update.mockResolvedValue({
        id: 'prod-1',
        slug: 'shahzadi-emerald-velvet-peshwas',
        basePrice: new Prisma.Decimal(195000),
        isActive: true,
      });

      const updated = await service.update('prod-1', { basePrice: 195000 });
      expect(updated.basePrice).toEqual(new Prisma.Decimal(195000));

      // Customer fetches by slug
      prismaService.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        slug: 'shahzadi-emerald-velvet-peshwas',
        basePrice: new Prisma.Decimal(195000),
        isActive: true,
        images: [],
        variants: [],
      });

      const customerProduct = await service.findByIdOrSlug('shahzadi-emerald-velvet-peshwas', false);
      expect(customerProduct.basePrice).toEqual(new Prisma.Decimal(195000));
    });
  });

  describe('5 & 6. Disable product and verify it no longer appears in public catalogue', () => {
    it('should soft-disable product and block customer access', async () => {
      prismaService.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        isActive: true,
      });
      prismaService.product.update.mockResolvedValue({
        id: 'prod-1',
        isActive: false,
      });

      await service.remove('prod-1');
      expect(prismaService.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
          data: { isActive: false },
        }),
      );

      // Customer querying disabled product by slug receives NotFoundException
      prismaService.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        slug: 'shahzadi-emerald-velvet-peshwas',
        isActive: false, // inactive!
      });

      await expect(
        service.findByIdOrSlug('shahzadi-emerald-velvet-peshwas', false), // customer mode
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('7. Test Product Variants and Stock Management', () => {
    it('should add new SKU variant and update inventory stock', async () => {
      prismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      prismaService.productVariant.findUnique.mockResolvedValue(null);
      prismaService.productVariant.create.mockResolvedValue({
        id: 'var-new',
        sku: 'KTQ-BRD-001-EMR-L',
        stockQuantity: 8,
      });

      const variant = await service.addVariant('prod-1', {
        sku: 'KTQ-BRD-001-EMR-L',
        stockQuantity: 8,
      });

      expect(variant.sku).toBe('KTQ-BRD-001-EMR-L');
      expect(variant.stockQuantity).toBe(8);

      // Update stock count
      prismaService.productVariant.findFirst.mockResolvedValue({
        id: 'var-new',
        productId: 'prod-1',
      });
      prismaService.productVariant.update.mockResolvedValue({
        id: 'var-new',
        stockQuantity: 15,
      });

      const updatedVariant = await service.updateVariantStock('prod-1', 'var-new', 15);
      expect(updatedVariant.stockQuantity).toBe(15);
    });

    it('should throw ConflictException if variant SKU already exists', async () => {
      prismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      prismaService.productVariant.findUnique.mockResolvedValue({ id: 'existing-var' });

      await expect(
        service.addVariant('prod-1', {
          sku: 'DUPLICATE-SKU',
          stockQuantity: 5,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('8. Test Product Image Gallery Upload & Removal', () => {
    it('should add image to product and allow deletion', async () => {
      prismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      prismaService.productImage.create.mockResolvedValue({
        id: 'img-10',
        imageUrl: '/assets/products/peshwas-back.jpg',
      });
      prismaService.productImage.delete.mockResolvedValue({ id: 'img-10' });

      const added = await service.addImage('prod-1', {
        storageKey: 'products/peshwas-back.jpg',
        imageUrl: '/assets/products/peshwas-back.jpg',
      });
      expect(added.imageUrl).toBe('/assets/products/peshwas-back.jpg');

      const deleted = await service.removeImage('prod-1', 'img-10');
      expect(deleted.id).toBe('img-10');
    });
  });
});
