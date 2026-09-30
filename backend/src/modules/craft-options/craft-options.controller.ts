import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CraftOptionsService } from './craft-options.service';
import { CreateCraftOptionDto } from './dto/create-craft-option.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Craft Options')
@Controller('craft-options')
export class CraftOptionsController {
  constructor(private readonly craftOptionsService: CraftOptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List artisan craftsmanship options (Zardozi, Resham, Crochet, etc.)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAll(@Query('includeInactive') includeInactive?: boolean) {
    return this.craftOptionsService.findAll(includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get craft option details by ID' })
  async findById(@Param('id') id: string) {
    return this.craftOptionsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new craftsmanship technique to catalog (Admin/Designer)' })
  async create(@Body() dto: CreateCraftOptionDto) {
    return this.craftOptionsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update craftsmanship details (Admin/Designer)' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCraftOptionDto>) {
    return this.craftOptionsService.update(id, dto);
  }
}
