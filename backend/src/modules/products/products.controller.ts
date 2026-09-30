import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import {
  CreateVariantDto,
  UpdateStockDto,
  AddProductImageDto,
} from './dto/create-variant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Products & Ready-to-Wear Catalog')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Browse luxury ready-to-wear products with search, category, price, colour, and sizing filters',
  })
  async findAll(@Query() filter: FilterProductsDto, @Req() req: Request) {
    const user = (req as any).user;
    const isAdmin =
      user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN);
    return this.productsService.findAll(filter, isAdmin);
  }

  @Get(':idOrSlug')
  @ApiOperation({
    summary:
      'Get full product details including variants, available stock, images, and size chart',
  })
  async findByIdOrSlug(
    @Param('idOrSlug') idOrSlug: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const isAdmin =
      user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN);
    return this.productsService.findByIdOrSlug(idOrSlug, isAdmin);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Create new luxury fashion product with initial variants and photography (Admin only)',
  })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Edit product pricing, description, customization, or active status (Admin only)',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Disable / soft-delete product from public catalog (Admin only)',
  })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attach a new photo to product gallery (Admin only)' })
  async addImage(
    @Param('id') productId: string,
    @Body() dto: AddProductImageDto,
  ) {
    return this.productsService.addImage(productId, dto);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product gallery image (Admin only)' })
  async removeImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.removeImage(productId, imageId);
  }

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Add a new SKU variant with colour, size, and stock level (Admin only)',
  })
  async addVariant(
    @Param('id') productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productsService.addVariant(productId, dto);
  }

  @Patch(':id/variants/:variantId/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update inventory stock count for a product variant (Admin only)',
  })
  async updateVariantStock(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.productsService.updateVariantStock(
      productId,
      variantId,
      dto.stockQuantity,
    );
  }
}
