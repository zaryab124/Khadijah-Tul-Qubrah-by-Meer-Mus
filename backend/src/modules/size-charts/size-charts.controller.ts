import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SizeChartsService } from './size-charts.service';
import { CreateSizeChartDto } from './dto/create-size-chart.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Size Charts')
@Controller('size-charts')
export class SizeChartsController {
  constructor(private readonly sizeChartsService: SizeChartsService) {}

  @Get()
  @ApiOperation({ summary: 'List all size measurement charts' })
  async findAll() {
    return this.sizeChartsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get size chart details and measurement matrix' })
  async findById(@Param('id') id: string) {
    return this.sizeChartsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new size chart matrix (Admin/Designer)' })
  async create(@Body() dto: CreateSizeChartDto) {
    return this.sizeChartsService.create(dto);
  }
}
