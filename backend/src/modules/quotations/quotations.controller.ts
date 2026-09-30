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
import { QuotationsService } from './quotations.service';
import { RequestChangesDto } from './dto/request-changes.dto';
import { RejectQuotationDto } from './dto/reject-quotation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Quotations & Revision Engine')
@Controller('quotations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get single quotation by ID with its itemized breakdown, fees, and designer notes',
  })
  async getQuotationById(@Param('id') id: string, @Req() req: any) {
    return this.quotationsService.getQuotationById(id, req.user);
  }

  @Post(':id/send')
  @ApiOperation({
    summary:
      'Designer/Admin sends draft quotation to customer (Transitions quote to SENT, request to QUOTE_SENT)',
  })
  async sendQuotation(@Param('id') id: string, @Req() req: any) {
    return this.quotationsService.sendQuotation(id, req.user);
  }

  @Post(':id/accept')
  @ApiOperation({
    summary:
      'Customer accepts quotation: locks quote as ACCEPTED, marks prior versions SUPERSEDED, and triggers Order creation',
  })
  async acceptQuotation(@Param('id') id: string, @Req() req: any) {
    return this.quotationsService.acceptQuotation(id, req.user);
  }

  @Post(':id/request-changes')
  @ApiOperation({
    summary:
      'Customer requests quotation modifications: triggers revision workflow and sets status to REVISION_REQUESTED',
  })
  async requestChanges(
    @Param('id') id: string,
    @Body() dto: RequestChangesDto,
    @Req() req: any,
  ) {
    return this.quotationsService.requestChanges(id, req.user, dto);
  }

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Customer or Admin rejects a quotation with explanation notes',
  })
  async rejectQuotation(
    @Param('id') id: string,
    @Body() dto: RejectQuotationDto,
    @Req() req: any,
  ) {
    return this.quotationsService.rejectQuotation(id, req.user, dto);
  }
}
