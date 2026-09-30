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
import { QuotationsService } from './quotations.service';
import { RequestClarificationDto } from './dto/request-clarification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Designer Dashboard & Operations')
@Controller('designer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DESIGNER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class DesignerController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary:
      'Designer Dashboard: overview of new unassigned requests, assigned requests, requests needing clarification, quotation preparation, revision requests, and completed quotes',
  })
  async getDashboard(@Req() req: any) {
    return this.quotationsService.getDesignerDashboard(req.user);
  }

  @Post('requests/:id/accept-job')
  @ApiOperation({
    summary: 'Designer self-assigns an unassigned custom design request',
  })
  async acceptJob(@Param('id') id: string, @Req() req: any) {
    return this.quotationsService.acceptJob(id, req.user);
  }

  @Post('requests/:id/request-clarification')
  @ApiOperation({
    summary:
      'Designer requests clarification from customer on design details, measurements, or color swatches',
  })
  async requestClarification(
    @Param('id') id: string,
    @Body() dto: RequestClarificationDto,
    @Req() req: any,
  ) {
    return this.quotationsService.requestClarification(id, req.user, dto);
  }
}
