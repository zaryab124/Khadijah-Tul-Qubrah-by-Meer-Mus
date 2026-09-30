import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SizesService } from './sizes.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Sizes')
@Controller('sizes')
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  @Get()
  @ApiOperation({ summary: 'List all standard sizing options' })
  async findAll() {
    return this.sizesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get size details by ID' })
  async findById(@Param('id') id: string) {
    return this.sizesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new size standard (Admin only)' })
  async create(@Body() dto: CreateSizeDto) {
    return this.sizesService.create(dto);
  }
}
