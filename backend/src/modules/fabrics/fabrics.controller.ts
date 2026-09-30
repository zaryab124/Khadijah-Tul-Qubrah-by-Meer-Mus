import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FabricsService } from './fabrics.service';
import { CreateFabricDto } from './dto/create-fabric.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Fabrics')
@Controller('fabrics')
export class FabricsController {
  constructor(private readonly fabricsService: FabricsService) {}

  @Get()
  @ApiOperation({ summary: 'List available luxury fabrics and per-meter pricing' })
  @ApiQuery({ name: 'includeUnavailable', required: false, type: Boolean })
  async findAll(@Query('includeUnavailable') includeUnavailable?: boolean) {
    return this.fabricsService.findAll(includeUnavailable);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fabric details by ID' })
  async findById(@Param('id') id: string) {
    return this.fabricsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new luxury fabric to catalog (Admin/Designer)' })
  async create(@Body() dto: CreateFabricDto) {
    return this.fabricsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update fabric details or meter pricing (Admin/Designer)' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateFabricDto>) {
    return this.fabricsService.update(id, dto);
  }
}
