import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { CreateVariantDto, AddProductImageDto } from './dto/create-variant.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: FilterProductsDto, isAdmin = false) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    // Only administrators can see inactive/draft products
    if (!isAdmin || !filter.includeInactive) {
      where.isActive = true;
    }

    if (filter.search) {
      const s = filter.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { sku: { contains: s, mode: 'insensitive' } },
        { tags: { has: s } },
      ];
    }

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.basePrice = {};
      if (filter.minPrice !== undefined) {
        where.basePrice.gte = new Prisma.Decimal(filter.minPrice);
      }
      if (filter.maxPrice !== undefined) {
        where.basePrice.lte = new Prisma.Decimal(filter.maxPrice);
      }
    }

    if (filter.isCustomizable !== undefined) {
      where.isCustomizable = filter.isCustomizable;
    }

    if (filter.colourId || filter.sizeId) {
      where.variants = {
        some: {
          isActive: true,
          ...(filter.colourId && { colourId: filter.colourId }),
          ...(filter.sizeId && { sizeId: filter.sizeId }),
        },
      };
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 2,
          },
          variants: {
            where: { isActive: true },
            include: {
              colour: { select: { id: true, name: true, hexCode: true } },
              size: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByIdOrSlug(idOrSlug: string, isAdmin = false) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const product = await this.prisma.product.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        category: true,
        sizeChart: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: isAdmin ? undefined : { isActive: true },
          include: {
            colour: true,
            size: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product "${idOrSlug}" not found`);
    }

    if (!isAdmin && !product.isActive) {
      throw new NotFoundException(`Product "${idOrSlug}" is currently unavailable`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug || this.generateSlug(dto.name);
    const sku = dto.sku || `KTQ-${Date.now().toString(36).toUpperCase()}`;

    const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException(`A product with slug "${slug}" already exists`);
    }

    const existingSku = await this.prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      throw new ConflictException(`A product with SKU "${sku}" already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug,
          sku,
          description: dto.description || null,
          basePrice: new Prisma.Decimal(dto.basePrice),
          isCustomizable: dto.isCustomizable ?? true,
          categoryId: dto.categoryId || null,
          sizeChartId: dto.sizeChartId || null,
          tags: dto.tags || [],
          isActive: true,
        },
      });

      if (dto.images && dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((img, idx) => ({
            productId: product.id,
            storageKey: img.storageKey,
            imageUrl: img.imageUrl,
            thumbnailUrl: img.thumbnailUrl || null,
            sortOrder: img.sortOrder ?? idx + 1,
            isPrimary: img.isPrimary ?? idx === 0,
          })),
        });
      }

      if (dto.variants && dto.variants.length > 0) {
        await tx.productVariant.createMany({
          data: dto.variants.map((v) => ({
            productId: product.id,
            colourId: v.colourId || null,
            sizeId: v.sizeId || null,
            sku: v.sku,
            stockQuantity: v.stockQuantity,
            priceAdjustment: new Prisma.Decimal(v.priceAdjustment ?? 0),
            isActive: true,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          images: true,
          variants: {
            include: { colour: true, size: true },
          },
          category: true,
          sizeChart: true,
        },
      });
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.prisma.product.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Slug "${dto.slug}" is already in use`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.basePrice !== undefined && {
          basePrice: new Prisma.Decimal(dto.basePrice),
        }),
        ...(dto.isCustomizable !== undefined && { isCustomizable: dto.isCustomizable }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.sizeChartId !== undefined && { sizeChartId: dto.sizeChartId }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
      include: {
        images: true,
        variants: { include: { colour: true, size: true } },
        category: true,
      },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addImage(productId: string, dto: AddProductImageDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return this.prisma.productImage.create({
      data: {
        productId,
        storageKey: dto.storageKey,
        imageUrl: dto.imageUrl,
        thumbnailUrl: dto.thumbnailUrl || null,
        sortOrder: dto.sortOrder ?? 1,
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  async removeImage(productId: string, imageId: string) {
    return this.prisma.productImage.delete({
      where: { id: imageId, productId },
    });
  }

  async addVariant(productId: string, dto: CreateVariantDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const existingSku = await this.prisma.productVariant.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException(`Variant with SKU "${dto.sku}" already exists`);
    }

    return this.prisma.productVariant.create({
      data: {
        productId,
        colourId: dto.colourId || null,
        sizeId: dto.sizeId || null,
        sku: dto.sku,
        stockQuantity: dto.stockQuantity,
        priceAdjustment: new Prisma.Decimal(dto.priceAdjustment ?? 0),
        isActive: true,
      },
      include: { colour: true, size: true },
    });
  }

  async updateVariantStock(productId: string, variantId: string, stockQuantity: number) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} not found on product ${productId}`);
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQuantity },
      include: { colour: true, size: true },
    });
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
