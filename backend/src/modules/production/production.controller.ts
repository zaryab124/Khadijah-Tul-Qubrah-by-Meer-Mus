import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ProductionService } from './production.service';
import { UpdateProductionStageDto } from './dto/update-production-stage.dto';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { CreateProductionJobDto } from './dto/create-production-job.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Atelier Production Floor & Quality Control (QC)')
@Controller('production')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('dashboard')
  @Roles(UserRole.PRODUCTION, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Atelier production dashboard overview across 8 workshop stages (New, Cutting, Stitching, Crafting, Finishing, QC, Ready, On-Hold)',
  })
  async getProductionDashboard(@Req() req: any) {
    return this.productionService.getProductionDashboard(req.user);
  }

  @Post('jobs')
  @Roles(UserRole.PRODUCTION, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Initiate a new production job for a paid order item',
  })
  async createProductionJob(
    @Body() dto: CreateProductionJobDto,
    @Req() req: any,
  ) {
    return this.productionService.createProductionJob(req.user, dto);
  }

  @Get('jobs/:id')
  @Roles(UserRole.PRODUCTION, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DESIGNER)
  @ApiOperation({
    summary:
      'Detailed operational job view: order, item specs, custom measurements, signed moodboard URLs, artisan updates, and QC reports',
  })
  async getJobOperationalDetails(@Param('id') id: string, @Req() req: any) {
    return this.productionService.getJobOperationalDetails(id, req.user);
  }

  @Post('jobs/:id/stage')
  @Roles(UserRole.PRODUCTION, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Advance garment production stage and update progress percentage (Rejects invalid transitions such as DELIVERED -> CUTTING)',
  })
  async updateProductionStage(
    @Param('id') id: string,
    @Body() dto: UpdateProductionStageDto,
    @Req() req: any,
  ) {
    return this.productionService.updateProductionStage(id, req.user, dto);
  }

  @Post('jobs/:id/quality-check')
  @Roles(UserRole.PRODUCTION, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Execute Quality Control inspection: if PASSED, job becomes READY and order READY_TO_SHIP; if FAILED, sends back to rework',
  })
  async submitQualityCheck(
    @Param('id') id: string,
    @Body() dto: CreateQualityCheckDto,
    @Req() req: any,
  ) {
    return this.productionService.submitQualityCheck(id, req.user, dto);
  }

  @Get('orders/:orderId/customer-progress')
  @ApiOperation({
    summary:
      'Customer-facing simplified production progress timeline (0%, 20%, 40%, 60%, 80%, 100% and milestone names)',
  })
  async getCustomerProgress(
    @Param('orderId') orderId: string,
    @Req() req: any,
  ) {
    return this.productionService.getCustomerProgress(orderId, req.user);
  }
}
