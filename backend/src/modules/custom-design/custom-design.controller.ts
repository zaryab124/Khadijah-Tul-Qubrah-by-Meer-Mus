import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomRequestStatus, UserRole } from '@prisma/client';
import { CustomDesignService } from './custom-design.service';
import { CreateCustomRequestDto } from './dto/create-custom-request.dto';
import { UpdateCustomRequestDto } from './dto/update-custom-request.dto';
import { UploadDesignFileDto } from './dto/upload-design-file.dto';
import { CreateMeasurementTemplateDto } from './dto/create-measurement-template.dto';
import { QuotationsService } from '../quotations/quotations.service';
import { CreateQuotationDto } from '../quotations/dto/create-quotation.dto';
import { RequestClarificationDto } from '../quotations/dto/request-clarification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Custom Design Studio ("Create Your Own")')
@Controller('custom-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomDesignController {
  constructor(
    private readonly customDesignService: CustomDesignService,
    private readonly quotationsService: QuotationsService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Step 1-9: Create bespoke custom design request draft (Choose product, fabric, craft, sizing)',
  })
  async createRequest(
    @Body() dto: CreateCustomRequestDto,
    @Req() req: any,
  ) {
    return this.customDesignService.createRequest(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List custom design requests (Customers see their own; Designers & Agents see assigned; Admins see all)',
  })
  @ApiQuery({ name: 'status', enum: CustomRequestStatus, required: false })
  async listRequests(
    @Query('status') status: CustomRequestStatus,
    @Req() req: any,
  ) {
    return this.customDesignService.listRequests(req.user, status);
  }

  @Get('measurement-templates')
  @ApiOperation({
    summary: 'Retrieve configurable measurement templates for different garment types',
  })
  async listMeasurementTemplates() {
    return this.customDesignService.listMeasurementTemplates();
  }

  @Post('measurement-templates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DESIGNER)
  @ApiOperation({
    summary: 'Define a new measurement template with dynamic fields (Admin/Designer only)',
  })
  async createMeasurementTemplate(@Body() dto: CreateMeasurementTemplateDto) {
    return this.customDesignService.createMeasurementTemplate(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get complete custom request details, specifications, quotation history, and signed file URLs',
  })
  async getRequestById(@Param('id') id: string, @Req() req: any) {
    return this.customDesignService.getRequestById(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update custom request specifications while in DRAFT or REVISION_REQUESTED status',
  })
  async updateRequest(
    @Param('id') id: string,
    @Body() dto: UpdateCustomRequestDto,
    @Req() req: any,
  ) {
    return this.customDesignService.updateRequest(id, req.user, dto);
  }

  @Post(':id/files')
  @ApiOperation({
    summary:
      'Step 3: Register an inspiration file, sketch, or swatch and receive pre-signed S3 upload URL',
  })
  async uploadFile(
    @Param('id') id: string,
    @Body() dto: UploadDesignFileDto,
    @Req() req: any,
  ) {
    return this.customDesignService.uploadFile(id, req.user, dto);
  }

  @Get(':id/files')
  @ApiOperation({
    summary:
      'Retrieve temporary signed download URLs for all inspiration and sketch files on request',
  })
  async getFiles(@Param('id') id: string, @Req() req: any) {
    return this.customDesignService.getFiles(id, req.user);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary:
      'Step 10: Submit completed custom design request for design review and quotation preparation',
  })
  async submitRequest(@Param('id') id: string, @Req() req: any) {
    return this.customDesignService.submitRequest(id, req.user);
  }

  // --- QUOTATIONS & DESIGNER COLLABORATION ENDPOINTS ---

  @Post(':id/quotations')
  @Roles(UserRole.DESIGNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Designer/Admin creates quotation (V1, V2, V3...) with itemized breakdown, customization fee, and delivery fee',
  })
  async createQuotation(
    @Param('id') id: string,
    @Body() dto: CreateQuotationDto,
    @Req() req: any,
  ) {
    return this.quotationsService.createQuotation(id, req.user, dto);
  }

  @Get(':id/quotations')
  @ApiOperation({
    summary: 'List all historical quotation versions (V1, V2, V3...) for this custom request',
  })
  async getQuotationsForRequest(@Param('id') id: string, @Req() req: any) {
    return this.quotationsService.getQuotationsForRequest(id, req.user);
  }

  @Post(':id/accept-job')
  @Roles(UserRole.DESIGNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Designer self-assigns an unassigned custom request for review and quotation',
  })
  async acceptJob(@Param('id') id: string, @Req() req: any) {
    return this.quotationsService.acceptJob(id, req.user);
  }

  @Post(':id/request-clarification')
  @Roles(UserRole.DESIGNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Designer requests clarification on measurements, colours, or fabric preferences',
  })
  async requestClarification(
    @Param('id') id: string,
    @Body() dto: RequestClarificationDto,
    @Req() req: any,
  ) {
    return this.quotationsService.requestClarification(id, req.user, dto);
  }
}
